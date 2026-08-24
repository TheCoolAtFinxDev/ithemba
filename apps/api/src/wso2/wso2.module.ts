import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Wso2Service } from './wso2.service';

@Module({
  imports: [HttpModule],
  providers: [Wso2Service],
  exports: [Wso2Service],
})
export class Wso2Module {}
