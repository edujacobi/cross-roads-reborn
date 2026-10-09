export default defineNuxtPlugin(() => {
	const popover = document.createElement("div");
	popover.id = "global-popover";
	popover.setAttribute("popover", "auto");
	document.body.appendChild(popover);

	let currentTarget: HTMLElement | null = null;

	function showPopover(target: HTMLElement) {
		const text = target.dataset.popoverText;
		if (!text) return;

		const direction = target.dataset.popoverDirection ?? "top";

		popover.textContent = text;
		popover.dataset.direction = direction;

		const rect = target.getBoundingClientRect();
		const gap = 8;

		popover.style.top = "0";
		popover.style.left = "0";
		popover.style.bottom = "auto";
		popover.style.right = "auto";

		popover.showPopover();

		const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

		requestAnimationFrame(() => {
			const pRect = popover.getBoundingClientRect();

			switch (direction) {
				case "top":
					popover.style.top = `${rect.top - pRect.height - gap}px`;
					popover.style.left = `${clamp(rect.left + rect.width / 2 - pRect.width / 2, 0, window.innerWidth - pRect.width)}px`;
					break;
				case "bottom":
					popover.style.top = `${rect.bottom + gap}px`;
					popover.style.left = `${clamp(rect.left + rect.width / 2 - pRect.width / 2, 0, window.innerWidth - pRect.width)}px`;
					break;
				case "left":
					popover.style.top = `${rect.top + rect.height / 2 - pRect.height / 2}px`;
					popover.style.left = `${clamp(rect.left - pRect.width - gap, 0, window.innerWidth - pRect.width)}px`;
					break;
				case "right":
					popover.style.top = `${rect.top + rect.height / 2 - pRect.height / 2}px`;
					popover.style.left = `${clamp(rect.right + gap, 0, window.innerWidth - pRect.width)}px`;
					break;
			}
		});

		currentTarget = target;
	}

	function hidePopover() {
		popover.hidePopover();
		currentTarget = null;
	}

	function onMouseEnter(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const text = target.dataset?.popoverText;
		if (text && target !== currentTarget) {
			showPopover(target);
		}
	}

	function onMouseLeave(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target === currentTarget) {
			hidePopover();
		}
	}

	document.addEventListener("mouseenter", onMouseEnter, true);
	document.addEventListener("mouseleave", onMouseLeave, true);

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			document.removeEventListener("mouseenter", onMouseEnter, true);
			document.removeEventListener("mouseleave", onMouseLeave, true);
		});
	}
});
