import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import axios from 'axios';

export interface ReceiptData {
  orderNumber: string;
  orderDate: Date;
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  pricingAdjustments?: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  paymentMethod?: string;
  restaurantName: string;
  restaurantLogoUrl: string;
  restaurantPhone: string;
  restaurantEmail: string;
  restaurantAddress: string;
}

@Injectable()
export class ReceiptGeneratorService {
  private readonly logger = new Logger(ReceiptGeneratorService.name);

  async generateReceiptPdf(data: ReceiptData): Promise<Readable> {
    const pageWidth = 226.77;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Fetch logo
    let logoBuffer: Buffer | null = null;
    try {
      const res = await axios.get(data.restaurantLogoUrl, {
        responseType: 'arraybuffer',
      });
      logoBuffer = Buffer.from(res.data);
    } catch {
      this.logger.warn('Could not fetch logo, using fallback circle');
    }

    // ── Pre-calculate page height ─────────────────────────
    const logoSize = 36;
    const headerH = logoSize + 8;
    const dashedDivider = 10;
    const titleH = 20;
    const badgeH = 18 + 8;
    const boxH = 26 + 8;
    const tableH = data.tableNumber ? 22 : 0;
    const itemsH = 12 + data.items.length * 14;
    const feesH =
      10 + // subtotal
      (data.pricingAdjustments?.length ?? 0) * 10 +
      (data.paymentMethod ? 10 : 0) +
      4;
    const totalH = 24;
    const feedbackH = 48;
    const pageHeight =
      margin +
      headerH +
      dashedDivider +
      titleH +
      dashedDivider +
      badgeH +
      boxH +
      tableH +
      8 + // line
      itemsH +
      8 + // line
      feesH +
      8 + // line
      totalH +
      8 + // line
      feedbackH +
      margin;

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
      autoFirstPage: true,
    });

    let y = margin;

    const drawDashedLine = (yPos: number) => {
      doc
        .save()
        .dash(2, { space: 3 })
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke()
        .undash()
        .restore();
    };

    const drawSolidLine = (yPos: number) => {
      doc
        .save()
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke()
        .restore();
    };

    // ── HEADER ────────────────────────────────────────────
    const logoX = margin;
    const logoY = y;

    if (logoBuffer) {
      // Clip to circle
      doc.save();
      doc
        .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
        .clip();
      doc.image(logoBuffer, logoX, logoY, {
        width: logoSize,
        height: logoSize,
      });
      doc.restore();
    } else {
      doc
        .save()
        .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
        .fillAndStroke('#2d7d6e', '#2d7d6e')
        .restore();
      doc
        .fillColor('#ffffff')
        .fontSize(6)
        .font('Helvetica-Bold')
        .text('CAFE', logoX, logoY + logoSize / 2 - 4, {
          width: logoSize,
          align: 'center',
        });
    }

    const infoX = logoX + logoSize + 6;
    const infoWidth = pageWidth - infoX - margin;

    doc
      .fillColor('#000000')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text(data.restaurantName, infoX, y + 2, { width: infoWidth });

    doc
      .fillColor('#555555')
      .fontSize(5.5)
      .font('Helvetica')
      .text(data.restaurantAddress, infoX, y + 14, { width: infoWidth })
      .text(data.restaurantPhone, infoX, doc.y, { width: infoWidth })
      .text(data.restaurantEmail, infoX, doc.y, { width: infoWidth });

    y += headerH;

    // ── DASHED DIVIDER ────────────────────────────────────
    drawDashedLine(y);
    y += 8;

    // ── RECEIPT TITLE ─────────────────────────────────────
    doc
      .fillColor('#000000')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Receipt', margin, y, { width: contentWidth, align: 'center' });
    y += 14;

    drawDashedLine(y);
    y += 8;

    // ── ORDER TYPE BADGE ──────────────────────────────────
    doc
      .save()
      .roundedRect(margin, y, contentWidth, 18, 3)
      .fillAndStroke('#f5f5f5', '#dddddd')
      .restore();

    doc
      .fillColor('#888888')
      .fontSize(6)
      .font('Helvetica')
      .text('Order Type', margin + 6, y + 5);

    doc
      .fillColor('#000000')
      .fontSize(7)
      .font('Helvetica-Bold')
      .text(data.orderType, margin, y + 5, {
        width: contentWidth - 30,
        align: 'right',
      });

    y += 18 + 8;

    // ── DATE / ORDER NUMBER BOX ───────────────────────────
    doc
      .save()
      .roundedRect(margin, y, contentWidth, 26, 3)
      .fillAndStroke('#f9f9f9', '#eeeeee')
      .restore();

    doc
      .fillColor('#888888')
      .fontSize(5.5)
      .font('Helvetica')
      .text('Date', margin + 5, y + 4)
      .text('Order Number', margin + 5, y + 4, {
        width: contentWidth - 10,
        align: 'right',
      });

    const formattedDate = data.orderDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fillColor('#000000')
      .fontSize(7)
      .font('Helvetica-Bold')
      .text(formattedDate, margin + 5, y + 14)
      .text(data.orderNumber, margin + 5, y + 14, {
        width: contentWidth - 10,
        align: 'right',
      });

    y += 26 + 8;

    // ── TABLE NUMBER ──────────────────────────────────────
    if (data.tableNumber) {
      doc
        .fillColor('#666666')
        .fontSize(6)
        .font('Helvetica')
        .text('Table Number', margin + 14, y);
      y += 8;
      doc
        .fillColor('#000000')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(data.tableNumber, margin + 14, y);
      y += 14;
    }

    drawSolidLine(y);
    y += 8;

    // ── ORDERED ITEMS ─────────────────────────────────────
    doc
      .fillColor('#000000')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('Ordered Items', margin, y);
    y += 12;

    data.items.forEach((item) => {
      doc
        .fillColor('#888888')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(`${item.quantity}x`, margin, y);

      doc
        .fillColor('#000000')
        .font('Helvetica')
        .text(item.name, margin + 14, y, { width: contentWidth - 60 });

      doc
        .font('Helvetica')
        .text(`Rp${item.total.toLocaleString('id-ID')}`, margin, y, {
          width: contentWidth,
          align: 'right',
        });

      y += 14;
    });

    drawSolidLine(y);
    y += 7;

    // ── FEES ──────────────────────────────────────────────
    const drawRow = (label: string, value: string, valueBold = false) => {
      doc
        .fillColor('#555555')
        .fontSize(7)
        .font('Helvetica')
        .text(label, margin, y);

      doc
        .fillColor('#000000')
        .font(valueBold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, margin, y, { width: contentWidth, align: 'right' });

      y += 10;
    };

    drawRow(
      `Subtotal (${data.items.length} menu)`,
      `Rp${data.subtotal.toLocaleString('id-ID')}`,
    );

    data.pricingAdjustments?.forEach((adj) => {
      const sign = adj.amount >= 0 ? '+' : '-';
      drawRow(
        adj.name,
        `${sign}Rp${Math.abs(adj.amount).toLocaleString('id-ID')}`,
      );
    });

    if (data.paymentMethod) {
      drawRow('Payment Method', data.paymentMethod, true);
    }

    y += 4;
    drawSolidLine(y);
    y += 8;

    // ── TOTAL ─────────────────────────────────────────────
    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Total', margin, y)
      .text(`Rp${data.totalAmount.toLocaleString('id-ID')}`, margin, y, {
        width: contentWidth,
        align: 'right',
      });

    y += 16;
    drawSolidLine(y);
    y += 10;

    // ── FEEDBACK BOX ──────────────────────────────────────
    const fbH = 38;
    doc
      .save()
      .roundedRect(margin, y, contentWidth, fbH, 4)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke()
      .restore();

    doc
      .fillColor('#000000')
      .fontSize(7)
      .font('Helvetica')
      .text("Let's give feedback on our service!", margin, y + 8, {
        width: contentWidth,
        align: 'center',
      });

    const btnY = y + fbH - 14;
    doc
      .save()
      .roundedRect(margin + 2, btnY, contentWidth - 4, 12, 3)
      .fillAndStroke('#f0f0f0', '#cccccc')
      .restore();

    doc
      .fillColor('#000000')
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('Give Feedback', margin, btnY + 2.5, {
        width: contentWidth,
        align: 'center',
      });

    doc.end();

    this.logger.log(`Receipt PDF generated for order ${data.orderNumber}`);
    return doc;
  }
}
