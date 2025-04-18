export class LoadingUI {
  constructor() {
    this.element = null;
    this.progressBar = null;
    this.progressText = null;
    this.titleElement = null;
    this.descriptionElement = null;
    this.initialize();
  }

  initialize() {
    // Create loading overlay
    this.element = document.createElement("div");
    this.element.className =
      "fixed inset-0 flex items-center justify-center z-50 hidden";

    // Create loading card
    const card = document.createElement("div");
    card.className =
      "bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-lg w-[350px]";

    // Create title
    this.titleElement = document.createElement("h3");
    this.titleElement.className =
      "text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2";
    this.titleElement.textContent = "Loading Elevation Data";

    // Create description
    this.descriptionElement = document.createElement("p");
    this.descriptionElement.className =
      "text-sm text-slate-500 dark:text-slate-400 mb-4";
    this.descriptionElement.textContent =
      "Please wait while fetching elevation data...";

    // Create progress container
    const progressContainer = document.createElement("div");
    progressContainer.className =
      "relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800";

    // Create progress bar
    this.progressBar = document.createElement("div");
    this.progressBar.className =
      "h-full w-0 flex-1 bg-slate-900 dark:bg-slate-50 transition-all duration-300";
    this.progressBar.style.width = "0%";

    // Create progress text
    this.progressText = document.createElement("p");
    this.progressText.className =
      "mt-2 text-xs text-slate-500 dark:text-slate-400 text-right";
    this.progressText.textContent = "0% complete";

    // Assemble the elements
    progressContainer.appendChild(this.progressBar);
    card.appendChild(this.titleElement);
    card.appendChild(this.descriptionElement);
    card.appendChild(progressContainer);
    card.appendChild(this.progressText);
    this.element.appendChild(card);

    // Add to body
    document.body.appendChild(this.element);
  }

  show(title, description) {
    if (title) {
      this.titleElement.textContent = title;
    }
    if (description) {
      this.descriptionElement.textContent = description;
    }
    this.element.classList.remove("hidden");
  }

  hide() {
    this.element.classList.add("hidden");
  }

  updateProgress(progress) {
    const percentage = Math.min(100, Math.max(0, progress)); // Clamp between 0-100
    this.progressBar.style.width = `${percentage}%`;
    this.progressText.textContent = `${Math.round(percentage)}% complete`;
  }
}
