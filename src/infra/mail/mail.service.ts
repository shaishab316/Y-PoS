import { Injectable } from '@nestjs/common';
import { SendMailData } from './mail.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendMail(data: SendMailData): Promise<void> {
    await this.mailer.sendMail({
      to: data.email,
      subject: data.subject,
      html: data.body,
      attachments: data.attachments,
    });
  }
}
