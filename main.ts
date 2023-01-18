import { Bart, BartOptions, ViewEngine, ViewEngineOptions } from "./deps.ts";

export type BartEngineOptions = Partial<ViewEngineOptions & BartOptions>;

export class BartEngine extends ViewEngine<Bart> {
  constructor(options?: BartEngineOptions) {
    super(new Bart(options), options);
  }

  async registerPartial(partial: string): Promise<void> {
    const template = await this.getPartialTemplate(partial);
    this.engine.registerPartials({ [partial]: template });
  }

  registerHelper(
    helperName: string,
    helperFunction: (...args: unknown[]) => unknown,
  ): Promise<void> {
    // deno-lint-ignore no-explicit-any
    this.engine.registerHelper(helperName, helperFunction as any);
    return Promise.resolve();
  }

  async view(
    template: string,
    data: Record<string, unknown>,
    options: Partial<ViewEngineOptions> = {},
  ): Promise<string> {
    options = { ...this.options, ...options };

    const viewTemplate = await this.getViewTemplate(template);
    const pageTmpl = this.engine.compile(viewTemplate);
    const content = pageTmpl(data);

    if (options.layout) {
      const layoutTemplate = await this.getLayoutTemplate(options.layout);
      const layoutTmpl = this.engine.compile(layoutTemplate);
      return layoutTmpl({ ...data, content });
    }

    return content;
  }

  async partial(
    template: string,
    data: Record<string, unknown>,
    options: Partial<ViewEngineOptions> = {},
  ): Promise<string> {
    options = { ...this.options, ...options };

    if (!this.engine.partials[template]) {
      await this.registerPartial(template);
    }

    const ast = this.engine.partials.get(template);
    return this.engine.execute(ast, data);
  }
}
