<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { DotsThreeCircle } from "phosphor-svelte";

  export interface Props {
    onSelect: (value: string) => void;
  }

  let { onSelect }: Props = $props();

</script>
<DropdownMenu.Root>
  <DropdownMenu.Trigger class="focus-visible border-bordinput bg-backgrounder-lt text-a-foreground inline-flex h-6 w-6 select-none items-center justify-center rounded-full border text-sm font-medium shadow-btn hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-98">

    <DotsThreeCircle class="h-6 w-6 text-foreground" />

  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-gray-200 data-[highlight-muted]" >
    <DropdownMenu.Group>
      <DropdownMenu.GroupHeading>Views</DropdownMenu.GroupHeading>
      <DropdownMenu.Separator />
        <!-- <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('carousel')} textValue="carousel">
          Carousel
        </DropdownMenu.Item> -->
        <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('chart')} textValue="chart">
          Chart
        </DropdownMenu.Item>
        <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('grid')} textValue="grid">
          Grid
        </DropdownMenu.Item>
        <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('news')} textValue="news">
          News
        </DropdownMenu.Item>
        <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('symbol')} textValue="symbol">
          Symbol View
        </DropdownMenu.Item>
        <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('analysis')} textValue="analysis">
          Technical Analysis
        </DropdownMenu.Item>
        <!-- <DropdownMenu.Item closeOnSelect={true} onclick={() => onSelect('thumbnail')} textValue="thumbnail">
          Thumbnail
        </DropdownMenu.Item> -->
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
