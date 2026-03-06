# View Settings

In the default base views there are settings specific to the view. For example,
in the cards view there is a slider that controls the width of cards.

Below is the rendered markup captured from the inspector:

```html
<div
	class="menu bases-toolbar-menu bases-toolbar-views-menu"
	style="left: 432px; top: 115.664px;"
>
	<div class="menu-grabber"></div>
	<div class="modal-header">
		<div class="modal-title">Views</div>
		<div class="modal-close-button tappable mod-raised clickable-icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="svg-icon lucide-check"
			>
				<path d="M20 6 9 17l-5-5"></path>
			</svg>
		</div>
	</div>
	<div class="menu-scroll">
		<div class="bases-toolbar-menu-container">
			<div class="bases-toolbar-menu-container-header">
				<div class="back-button">
					<div class="back-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="svg-icon lucide-chevron-left"
						>
							<path d="m15 18-6-6 6-6"></path>
						</svg>
					</div>
					<div class="back-label">Configure view</div>
				</div>
				<div class="clickable-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="svg-icon lucide-more-vertical"
					>
						<circle cx="12" cy="12" r="1"></circle>
						<circle cx="12" cy="5" r="1"></circle>
						<circle cx="12" cy="19" r="1"></circle>
					</svg>
				</div>
				<div class="close-icon clickable-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="svg-icon lucide-x"
					>
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</div>
			</div>
			<div class="bases-toolbar-menu-form view-config-menu">
				<div class="input-row">
					<div class="input-row-content">
						<input
							type="text"
							spellcheck="false"
							placeholder="View name"
						/>
					</div>
				</div>
				<div class="input-row">
					<div class="input-row-label">Layout</div>
					<div class="input-row-content">
						<div class="combobox-button" tabindex="0">
							<div class="combobox-button-icon" style="">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-layout-grid"
								>
									<rect
										x="3"
										y="3"
										width="7"
										height="7"
										rx="1"
									></rect>
									<rect
										x="14"
										y="3"
										width="7"
										height="7"
										rx="1"
									></rect>
									<rect
										x="14"
										y="14"
										width="7"
										height="7"
										rx="1"
									></rect>
									<rect
										x="3"
										y="14"
										width="7"
										height="7"
										rx="1"
									></rect>
								</svg>
							</div>
							<div class="combobox-button-label">Cards</div>
							<div class="combobox-clear-button">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-x"
								>
									<path d="M18 6 6 18"></path>
									<path d="m6 6 12 12"></path>
								</svg>
							</div>
							<div class="combobox-button-chevron">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-chevrons-up-down"
								>
									<path d="m7 15 5 5 5-5"></path>
									<path d="m7 9 5-5 5 5"></path>
								</svg>
							</div>
						</div>
					</div>
				</div>
				<div class="input-row">
					<div class="input-row-label">Card size</div>
					<div class="input-row-content">
						<input
							class="slider"
							type="range"
							data-ignore-swipe="true"
							min="50"
							max="800"
							step="10"
						/>
					</div>
				</div>
				<div class="input-row">
					<div class="input-row-label">Image property</div>
					<div class="input-row-content">
						<div class="combobox-button" tabindex="0">
							<div
								class="combobox-button-icon"
								style="display: none;"
							></div>
							<div
								class="combobox-button-label"
								placeholder="Property"
							></div>
							<div class="combobox-clear-button">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-x"
								>
									<path d="M18 6 6 18"></path>
									<path d="m6 6 12 12"></path>
								</svg>
							</div>
							<div class="combobox-button-chevron">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="svg-icon lucide-chevrons-up-down"
								>
									<path d="m7 15 5 5 5-5"></path>
									<path d="m7 9 5-5 5 5"></path>
								</svg>
							</div>
						</div>
					</div>
				</div>
				<div class="input-row">
					<div class="input-row-label">Image fit</div>
					<div class="input-row-content">
						<select class="dropdown">
							<option value="">Cover</option>
							<option value="contain">Contain</option>
						</select>
					</div>
				</div>
				<div class="input-row">
					<div class="input-row-label">Image aspect ratio</div>
					<div class="input-row-content">
						<input
							class="slider"
							type="range"
							data-ignore-swipe="true"
							min="0.25"
							max="2.5"
							step="0.05"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
```

Lets also have a card size slider in the kanban view settings. This should
affect the size of the card and the width of the folder columns.
