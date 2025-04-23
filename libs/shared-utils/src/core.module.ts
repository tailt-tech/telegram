import { Module } from '@nestjs/common';
import { StorageModule } from '@app/storage';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
    StorageModule,
  ],
  exports: [HttpModule, StorageModule],
})
export class CoreModule {}
