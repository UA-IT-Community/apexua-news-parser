import { Get, Post, Router } from "@discordx/koa";
import { channel } from "diagnostics_channel";
import { WebhookClient } from "discord.js";
import type { Context } from "koa";
import Telegram from "node-telegram-bot-api";

declare type ChannelPostUpdate = {
  update_id: Number;
  channel_post: {
    text: string | undefined;
    caption: string | undefined;
    message_id: Number;
    sender_chat: { id: Number; title: string; type: "channel" };
    chat: { id: Number; title: string; type: "channel" };
    date: string;
    media_group_id: string | undefined;
    photo: [
      {
        file_id: string;
        file_unique_id: string;
        file_size: Number;
        width: Number;
        height: Number;
      },
    ];
  };
};

const bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN as string);
const TemporaryMediaGroupStorage: {
  [key: string]: {
    message: string;
    files: Array<string>;
  };
} = {};
const timers: { [key: string]: NodeJS.Timeout } = {};
const promoMessage = `😉  До речі, також новини гри та ком'юніті апексу є і у телеграмі — <https://t.me/ApexLegendUA>`;

@Router()
export class API {
  webhookClient: WebhookClient;

  constructor() {
    this.webhookClient = new WebhookClient({
      id: process.env.DISCORD_WEBHOOK_ID as string,
      token: process.env.DISCORD_WEBHOOK_TOKEN as string,
    });
  }

  @Get("/")
  indexGet(context: Context): void {
    context.body = `
      <div style="text-align: center">
        <h1>
          <a href="https://discordx.js.org">discord.ts</a> rest api server example
        </h1>
        <p>
          powered by <a href="https://koajs.com/">koa</a> and
          <a href="https://www.npmjs.com/package/@discordx/koa">@discordx/koa</a>
        </p>
      </div>
    `;
  }

  @Post("/")
  async index(context: Context): Promise<void> {
    const body = context.request.body as ChannelPostUpdate;
    if (!body.channel_post) return this.indexGet(context);
    if (body.channel_post.media_group_id) {
      await this.waitAndBuildAttachments(body.channel_post);
    } else {
      await this.buildAndPublish(body.channel_post);
    }

    context.body = `
      <div style="text-align: center">
        <h1>
          <a href="https://discordx.js.org">discord.ts</a> rest api server example
        </h1>
        <p>
          powered by <a href="https://koajs.com/">koa</a> and
          <a href="https://www.npmjs.com/package/@discordx/koa">@discordx/koa</a>
        </p>
      </div>
    `;
  }

  async buildAndPublish(
    channelPost: ChannelPostUpdate["channel_post"]
  ): Promise<void> {
    const message = channelPost.caption || channelPost.text || "";
    const attachments = [];
    if (channelPost.photo) {
      attachments.push(
        await this.getAttachment(
          channelPost.photo,
          channelPost.photo.length - 1
        )
      );
    }
    this.publish(message.replace("@ApexLegendUA", promoMessage), attachments);
  }

  async waitAndBuildAttachments(
    channelPost: ChannelPostUpdate["channel_post"]
  ): Promise<void> {
    //Check if timer is going
    if (timers[channelPost.media_group_id as string]) {
      clearTimeout(timers[channelPost.media_group_id as string]);
    }

    //Push media to media storage
    if (!TemporaryMediaGroupStorage[channelPost.media_group_id as string]) {
      const message = channelPost.caption || channelPost.text || "";
      TemporaryMediaGroupStorage[channelPost.media_group_id as string] = {
        message: message.replace("@ApexLegendUA", promoMessage),
        files: [],
      };
    }
    
    if (channelPost.photo) {
      TemporaryMediaGroupStorage[
        channelPost.media_group_id as string
      ].files.push(
        await this.getAttachment(
          channelPost.photo,
          channelPost.photo.length - 1
        )
      );
    }

    //Start timeout for publication
    timers[channelPost.media_group_id as string] = setTimeout(async () => {
      this.publish(
        TemporaryMediaGroupStorage[channelPost.media_group_id as string]
          .message,
        TemporaryMediaGroupStorage[channelPost.media_group_id as string].files
      );
      delete TemporaryMediaGroupStorage[channelPost.media_group_id as string];
    }, 1000);
  }

  publish(message: string, attachments: string[]): void {
    let files = [];

    for (const attachment of attachments) {
      files.push({
        attachment,
      });
    }

    this.webhookClient.send({
      content: message,
      username: "ApexUA-News",
      avatarURL:
        "https://editors.charlieintel.com/wp-content/uploads/2023/10/19/who-is-conduit-in-apex-legends-abilities.jpg",
      files,
    });
  }

  async getAttachment(list: Array<any>, index: number): Promise<string> {
    const attachment = await bot.getFile(list[index].file_id);
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${attachment.file_path}`;
  }
}
