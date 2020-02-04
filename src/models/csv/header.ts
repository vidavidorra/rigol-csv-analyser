export class Header {
  private increment: number;
  private channels: string[];
  private columns: string[];
  private indexColumnName = 'i';
  private firstDataLine = 3;

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
    return [this.indexColumnName].concat(this.channels);
  }

  public IndexColumnName(): string {
    return this.indexColumnName;
  }

  public FirstDataLine(): number {
    return this.firstDataLine;
  }
}
