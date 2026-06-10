import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PaymentService } from './payment.service';
import { MailService } from '@/infra/mail/mail.service';

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly mailService: MailService,
  ) {}

  @OnEvent('todayPaymentVerify')
  async handleTodayPaymentVerify(data: any) {
    try {
      this.logger.log(`📥 Received 'todayPaymentVerify' event for verification record ID ${data.id}...`);

      // 1. Fetch all active users with role = OWNER
      const owners = await this.prisma.user.findMany({
        where: {
          role: 'OWNER',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          businessEmail: true,
        },
      });

      if (!owners.length) {
        this.logger.warn('⚠️ No active users with role OWNER found. Skipping email report.');
        return;
      }

      // Collect recipient email addresses
      const emails = owners
        .map((owner) => owner.email ?? owner.businessEmail)
        .filter((email): email is string => !!email);

      if (!emails.length) {
        this.logger.warn('⚠️ No email addresses found for owners. Skipping email report.');
        return;
      }

      // 2. Generate the Excel workbook buffer for today's payments
      this.logger.log('📊 Exporting today\'s payments to Excel buffer...');
      const buffer = await this.paymentService.exportTodayPaymentsToExcel();

      // 3. Format date and metrics for HTML template
      const formattedDate = new Date(data.date || new Date()).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const discrepancy = (data.actualAmount || 0) - (data.totalAmount || 0);
      const isMismatch = discrepancy !== 0;

      const discrepancySign = discrepancy > 0 ? '+' : '';
      const discrepancyText = isMismatch
        ? `${discrepancySign}${discrepancy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '0.00';

      const statusBanner = isMismatch
        ? `
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
              <span style="color: #991b1b; font-weight: 600; font-size: 15px; font-family: sans-serif;">Payment Discrepancy Warning</span>
            </div>
            <p style="color: #7f1d1d; font-size: 13px; margin: 6px 0 0 0; font-family: sans-serif; line-height: 1.5;">
              The actual verified amount does not match the expected total amount. A discrepancy of <strong>${discrepancyText}</strong> was noted.
            </p>
          </div>
        `
        : `
          <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 8px;">✅</span>
              <span style="color: #166534; font-weight: 600; font-size: 15px; font-family: sans-serif;">Verification Balanced</span>
            </div>
            <p style="color: #14532d; font-size: 13px; margin: 6px 0 0 0; font-family: sans-serif; line-height: 1.5;">
              All transactions have been successfully reconciled. The verified amount matches the expected total with zero discrepancy.
            </p>
          </div>
        `;

      const remarkHtml = data.remark
        ? `
          <div style="margin-top: 24px;">
            <h3 style="color: #334155; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0; font-family: sans-serif;">Remarks / Notes</h3>
            <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 12px 16px; border-radius: 0 8px 8px 0; font-style: italic; color: #475569; font-size: 14px; font-family: sans-serif;">
              "${data.remark}"
            </div>
          </div>
        `
        : '';

      const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Payment Verification Report</title>
      </head>
      <body style="background-color: #f1f5f9; padding: 24px 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <!-- Main Card -->
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                <!-- Top Gradient Accent -->
                <tr>
                  <td height="6" style="background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);"></td>
                </tr>
                
                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px;">
                    <!-- Header -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <tr>
                        <td>
                          <div style="color: #6366f1; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Smart POS Systems</div>
                          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">Payment Verification Report</h1>
                          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Report generated on ${formattedDate}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Status Banner -->
                    ${statusBanner}

                    <!-- Summary Stats Grid -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
                      <tr>
                        <!-- Expected Amount -->
                        <td width="33%" style="padding: 20px; border-right: 1px solid #f1f5f9; text-align: center;">
                          <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Expected Total</div>
                          <div style="color: #0f172a; font-size: 18px; font-weight: 700;">${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </td>
                        <!-- Actual Amount -->
                        <td width="33%" style="padding: 20px; border-right: 1px solid #f1f5f9; text-align: center;">
                          <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Actual Verified</div>
                          <div style="color: #0f172a; font-size: 18px; font-weight: 700;">${data.actualAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </td>
                        <!-- Discrepancy -->
                        <td width="34%" style="padding: 20px; text-align: center;">
                          <div style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Discrepancy</div>
                          <div style="color: ${isMismatch ? '#e11d48' : '#059669'}; font-size: 18px; font-weight: 700;">${discrepancyText}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Section -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 500;">Verified By:</span>
                        </td>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                          <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${data.verifiedBy?.name || 'N/A'} (ID: ${data.verifiedBy?.id || 'N/A'})</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 500;">Date & Time:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                          <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${new Date().toLocaleString('en-US')}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 500;">Attachment:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                          <span style="color: #4f46e5; font-size: 13px; font-weight: 600; text-decoration: none;">
                            today-payments-${new Date().toISOString().split('T')[0]}.xlsx
                            ${data.proofImages?.length ? `<br><span style="color: #64748b; font-weight: normal; font-size: 11px;">+ ${data.proofImages.length} proof image(s) attached</span>` : ''}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Remarks -->
                    ${remarkHtml}

                    <!-- Description/Next Steps -->
                    <div style="margin-top: 32px; background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 16px;">
                      <p style="color: #6b21a8; font-size: 13px; margin: 0; line-height: 1.5; font-weight: 500;">
                        ℹ️ The full list of today's transactions is attached to this email as an Excel spreadsheet for your reference and auditing.
                      </p>
                    </div>

                    <!-- Divider -->
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;">

                    <!-- Footer -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated report from Smart POS.</p>
                          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Smart POS. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      // 4. Send emails to each owner
      const attachmentName = `today-payments-${new Date().toISOString().split('T')[0]}.xlsx`;
      const subject = `Daily Payment Verification Report - ${formattedDate}`;

      const proofImageAttachments = (data.proofImages || []).map((url: string, index: number) => {
        const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
        return {
          filename: `proof-image-${index + 1}.${ext}`,
          path: url,
        };
      });

      for (const email of emails) {
        this.logger.log(`✉️ Sending payment verification report email to: ${email}...`);
        await this.mailService.sendMail({
          email,
          subject,
          body: htmlBody,
          attachments: [
            {
              filename: attachmentName,
              content: Buffer.from(buffer),
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            ...proofImageAttachments,
          ],
        });
      }

      this.logger.log('✅ Daily payment verification emails sent successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to process todayPaymentVerify event and send emails:', error);
    }
  }
}
