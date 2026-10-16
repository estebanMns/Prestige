import type { NextRequest } from "next/server";
import type { AskAssistantUseCase } from "@/core/application/use-cases/chat/AskAssistantUseCase";
import type { PlaceOrderUseCase } from "@/core/application/use-cases/orders/PlaceOrderUseCase";
import type { RequestContext } from "../RequestContext";
import { chatSchema, placeOrderSchema } from "../schemas";
import { BaseController } from "./BaseController";

/** Acciones públicas del cliente: enviar un pedido y conversar con el asesor. */
export class StorefrontController extends BaseController {
  constructor(
    private readonly context: RequestContext,
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly askAssistantUseCase: AskAssistantUseCase,
  ) {
    super();
  }

  placeOrder = (request: NextRequest) =>
    this.handle(async () => {
      const input = await this.body(request, placeOrderSchema);
      return this.ok(await this.placeOrderUseCase.execute(input), { status: 201 });
    });

  chat = (request: NextRequest) =>
    this.handle(async () => {
      const { messages } = await this.body(request, chatSchema);
      return this.ok(await this.askAssistantUseCase.execute({ history: messages, clientKey: this.context.clientIp(request) }));
    });
}
