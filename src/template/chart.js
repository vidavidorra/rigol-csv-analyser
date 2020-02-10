$.getJSON('{{ dataFile }}', function(data) {
  const start = new Date();
  // eslint-disable-next-line no-undef
  Highcharts.stockChart('chart-container', {
    chart: {
      type: 'line',
      events: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        load: function() {
          this.setTitle(null, {
            text: `Built chart in ${new Date() - start} ms`,
          });

          this.annotations.forEach(annotation => {
            annotation.setControlPointsVisibility(true);
            annotation.cpVisibility = true;
          });
        },
      },
      zoomType: 'x',
      panKey: 'shift',
      height: '40%',
    },
    title: {
      text: '{{ title }}',
    },
    subtitle: {
      text: 'Built chart in ...',
    },
    legend: {
      enabled: true,
    },
    rangeSelector: {
      buttons: [
        {
          type: 'millisecond',
          count: 100,
          text: '100 ns',
        },
        {
          type: 'millisecond',
          count: 1e3,
          text: '1 μs',
        },
        {
          type: 'millisecond',
          count: 10e3,
          text: '10 μs',
        },
        {
          type: 'millisecond',
          count: 100e3,
          text: '100 μs',
        },
        {
          type: 'millisecond',
          count: 1e6,
          text: '1 ms',
        },
        {
          type: 'millisecond',
          count: 10e6,
          text: '10 ms',
        },
        {
          type: 'millisecond',
          count: 100e6,
          text: '100 ms',
        },
        {
          type: 'millisecond',
          count: 1e9,
          text: '1 s',
        },
        {
          type: 'millisecond',
          count: 10e9,
          text: '10 s',
        },
        {
          type: 'millisecond',
          count: 100e9,
          text: '100 s',
        },
        {
          type: 'all',
          text: 'All',
        },
      ],
      buttonTheme: {
        width: 40,
      },
      inputEnabled: false,
    },
    stockTools: {
      gui: {
        buttons: ['toggleAnnotations', 'separator', 'fullScreen'],
      },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        formatter: function() {
          // console.log(
          //   `min: ${this.axis.min.toFixed(0) /
          //     1000} μs, max: ${this.axis.max.toFixed(0) / 1000} μs, range: ${(
          //     this.axis.max - this.axis.min
          //   ).toFixed(0) / 1000} μs`
          // );
          return `${(this.value / 1000).toLocaleString()} ms`;
        },
      },
    },

    tooltip: {
      split: true,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      formatter: function() {
        const tooltip = [`<b>${(this.x / 1000).toLocaleString()} ms<b>`];

        this.points.forEach(point => {
          tooltip.push(`${point.y} V`);
        });

        return tooltip;
      },
    },
    navigator: {
      height: 100,
      xAxis: {
        labels: {
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          formatter: function() {
            return `${(this.value / 1000).toLocaleString()} ms`;
          },
        },
      },
    },
    annotations: [
      {
        type: 'measure',
        typeOptions: {
          point: {
            x: 0,
            y: 0,
            controlPoint: {
              /* control point options */
            },
          },
          label: {
            enabled: false,
          },
          background: {
            width: 300 + 'px',
            height: 150 + 'px',
          },
        },
      },
    ],
    plotOptions: {
      series: {
        marker: {
          enabledThreshold: 5,
        },
      },
    },
    series: data.series,
  });
});
