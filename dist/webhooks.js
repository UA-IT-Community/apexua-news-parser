var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Get, Post, Router } from "@discordx/koa";
import { WebhookClient } from "discord.js";
import Telegram from "node-telegram-bot-api";
const bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);
const TemporaryMediaGroupStorage = {};
const timers = {};
const message = `😉  До речі, також новини гри та ком'юніті апексу є і у телеграмі — <https://t.me/ApexLegendUA>`;
let API = class API {
    webhookClient;
    constructor() {
        this.webhookClient = new WebhookClient({
            id: process.env.DISCORD_WEBHOOK_ID,
            token: process.env.DISCORD_WEBHOOK_TOKEN,
        });
    }
    indexGet(context) {
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
    async index(context) {
        const body = context.request.body;
        if (body.channel_post.media_group_id) {
            await this.waitAndBuildAttachments(body.channel_post);
        }
        else {
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
    async buildAndPublish(channelPost) {
        this.publish(channelPost.caption.replace("@ApexLegendUA", message), [
            await this.getAttachment(channelPost.photo, channelPost.photo.length - 1),
        ]);
    }
    async waitAndBuildAttachments(channelPost) {
        //Check if timer is going
        if (timers[channelPost.media_group_id]) {
            clearTimeout(timers[channelPost.media_group_id]);
        }
        //Push media to media storage
        if (!TemporaryMediaGroupStorage[channelPost.media_group_id]) {
            TemporaryMediaGroupStorage[channelPost.media_group_id] = {
                message: channelPost.caption.replace("@ApexLegendUA", message),
                files: [],
            };
        }
        TemporaryMediaGroupStorage[channelPost.media_group_id].files.push(await this.getAttachment(channelPost.photo, channelPost.photo.length - 1));
        //Start timeout for publication
        timers[channelPost.media_group_id] = setTimeout(async () => {
            this.publish(TemporaryMediaGroupStorage[channelPost.media_group_id]
                .message, TemporaryMediaGroupStorage[channelPost.media_group_id].files);
            delete TemporaryMediaGroupStorage[channelPost.media_group_id];
        }, 1000);
    }
    publish(message, attachments) {
        let files = [];
        for (const attachment of attachments) {
            files.push({
                attachment,
            });
        }
        this.webhookClient.send({
            content: message,
            username: "ApexUA-News",
            avatarURL: "https://editors.charlieintel.com/wp-content/uploads/2023/10/19/who-is-conduit-in-apex-legends-abilities.jpg",
            files,
        });
    }
    async getAttachment(list, index) {
        const attachment = await bot.getFile(list[index].file_id);
        return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${attachment.file_path}`;
    }
};
__decorate([
    Get("/"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], API.prototype, "indexGet", null);
__decorate([
    Post("/"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], API.prototype, "index", null);
API = __decorate([
    Router(),
    __metadata("design:paramtypes", [])
], API);
export { API };
