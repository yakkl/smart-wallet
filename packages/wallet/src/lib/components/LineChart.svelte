<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import Chart from 'chart.js/auto';

  export let data: { x: Date; y: number }[];

  let chartRef: HTMLCanvasElement;
  let chart: Chart;

  $: chartData = {
    labels: data.map(d => d.x.toLocaleString()),
    datasets: [
      {
        data: data.map(d => d.y),
        fill: false,
        borderColor: getTrendColor(data),
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  function getTrendColor(data: { x: Date; y: number }[]) {
    if (data.length < 2) {
      return 'rgb(34, 197, 94)'; // Green color for upward trend
    }

    const lastIndex = data.length - 1;
    const lastPrice = data[lastIndex].y;
    const previousPrice = data[lastIndex - 1]?.y;

    if (previousPrice && lastPrice < previousPrice) {
      return 'rgb(220, 38, 38)'; // Red color for downward trend
    } else {
      return 'rgb(34, 197, 94)'; // Green color for upward trend
    }
  }

  onMount(() => {
    chart = new Chart(chartRef, {
      type: 'line',
      data: chartData,
      options,
    });
  });

  afterUpdate(() => {
    if (chart) {
      chart.data = chartData;
      chart.update();
    }
  });
</script>

<div class="w-full h-full">
  <canvas bind:this={chartRef} class="w-full h-full"></canvas>
</div>
