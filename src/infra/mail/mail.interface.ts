export interface SendMailData {
  email: string;
  subject: string;
  body: string;
  attachments?: {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }[];
}

