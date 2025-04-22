import { NestFactory } from '@nestjs/core';
import { TelBotModule } from './tel-bot.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(TelBotModule);
}

bootstrap();
