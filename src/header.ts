export class Header {
  private increment: number;
  private channels: string[];

  constructor(increment: number, channels: string[]) {
    this.increment = increment;
    this.channels = channels;
  }

  public Increment(): number {
    return this.increment;
  }

  public Channels(): string[] {
    return this.channels;
  }

  public Columns(): string[] {
    return ['index'].concat(this.channels);
  }

  public FirstDataLine(): number {
    return 3;
  }
}
