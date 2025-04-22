import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BaseLog {
  protected readonly logger: Logger;
  constructor() {
    this.logger = new Logger(this.constructor.name);
  }
}
