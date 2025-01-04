import { LinkPreview as HoverCardPrimitive } from "bits-ui";

import Content from "./hover-card-content.svelte";
const Root = HoverCardPrimitive.Root;
const Trigger = HoverCardPrimitive.Trigger;
const Arrow = HoverCardPrimitive.Arrow;

export {
	Root,
  Arrow,
	Content,
	Trigger,
	Root as HoverCard,
	Content as HoverCardContent,
	Trigger as HoverCardTrigger,
};
