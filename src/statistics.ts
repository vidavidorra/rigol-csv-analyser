import * as ss from 'simple-statistics';

export class Statistics {
  private n = 0;
  private sum = 0;
  private min = Number.POSITIVE_INFINITY;
  private max = Number.NEGATIVE_INFINITY;
  private oldMean = 0;
  private newMean = 0;
  private oldS = 0;
  private newS = 0;
  private sampleStandardDeviation = 0;

  N(): number {
    return this.n;
  }

  Min(): number {
    return this.min;
  }

  Max(): number {
    return this.max;
  }

  Sum(): number {
    return this.sum;
  }

  Mean(): number {
    return this.newMean;
  }

  Variance(): number {
    if (this.n <= 1) {
      return 0;
    }

    return this.newS / (this.n - 1);
  }

  StandardDeviation(): number {
    return Math.sqrt(this.Variance());
  }

  SampleStandardDeviation(): number {
    return this.sampleStandardDeviation;
  }

  Push(x: number[]): void {
    this.sum += ss.sum(x);
    this.min = ss.min(x.concat(this.min));
    this.max = ss.max(x.concat(this.max));

    x.forEach(value => {
      this.PushValue(value);
    });
  }

  Print(): void {
    console.log(`
Count  : ${this.N()}
Sum    : ${this.Sum()}
Min    : ${this.Min()}
Max    : ${this.Max()}
Mean   : ${this.Mean()}
Var.s  : ${this.Variance()}
Stdev.s: ${this.StandardDeviation()}`);
  }

  private PushValue(x: number): void {
    this.n++;

    // See Knuth TAOCP vol 2, 3rd edition, page 232.
    if (this.n === 1) {
      this.newMean = x;
      this.oldMean = this.newMean;
    } else {
      this.newMean = this.oldMean + (x - this.oldMean) / this.n;
      this.newS = this.oldS + (x - this.oldMean) * (x - this.newMean);

      console.log(
        ' ',
        x,
        ': ',
        this.oldS,
        this.newS,
        this.oldMean,
        this.newMean
      );

      // Prepare for the next iteration.
      this.oldMean = this.newMean;
      this.oldS = this.newS;
    }
  }
}
