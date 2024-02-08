export default class BasePage {
  constructor(client) {
    this.client = client;
  }

  async open(path) {
    const url = await this.client.getUrl();
    this.originalUrl = url;
    await this.client.navigateTo(`${this.originalUrl}${path}`);
  }

  async goHome() {
    if (this.originalUrl) {
      await this.client.navigateTo(this.originalUrl);
    }
  }
}
