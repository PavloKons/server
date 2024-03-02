// notification.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from '../gateways/notification.gateway';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Get(':message')
  sendNotification(@Param('message') message: string): string {
    this.notificationGateway.handleNotification(message);
    return 'Notification sent: ' + message;
  }
}
