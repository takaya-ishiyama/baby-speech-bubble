import "./style.css";

const captions = [
  "ミルク、まだですか？",
  "抱っこを要求します",
  "本日のかわいい、完了",
  "ねむい。でも寝ない",
  "おむつ会議を始めます",
  "そのおもちゃ、気になります",
  "いま笑った？気のせいです",
  "もう一回いないいないばあ",
  "今日も成長しています",
  "ちょっと休憩しませんか",
  "ここがいちばん安心",
  "泣くのもお仕事です",
  "おなかいっぱいです",
  "まだ遊べます",
  "写真はかわいくお願いします",
  "みんな、わたしを見て",
  "寝返りの練習中です",
  "それ、食べられますか？",
  "今日はごきげんです",
  "だっこ延長でお願いします"
];

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const input = required<HTMLInputElement>("#photoInput");
const captionInput = required<HTMLInputElement>("#captionInput");
const canvas = required<HTMLCanvasElement>("#canvas");
const emptyState = required<HTMLElement>("#emptyState");
const rerollButton = required<HTMLButtonElement>("#rerollButton");
const applyButton = required<HTMLButtonElement>("#applyButton");
const downloadButton = required<HTMLButtonElement>("#downloadButton");
const dropZone = required<HTMLElement>("#dropZone");

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported by this browser.");
  return context;
}

const context = getCanvasContext(canvas);

let sourceImage: HTMLImageElement | null = null;
let currentCaption = "";
let previousRandomCaption = "";

function randomCaption(): string {
  const candidates = captions.filter((caption) => caption !== previousRandomCaption);
  const caption = candidates[Math.floor(Math.random() * candidates.length)] ?? captions[0];
  previousRandomCaption = caption;
  return caption;
}

function fitCanvas(image: HTMLImageElement): void {
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  context.font = `900 ${fontSize}px ui-rounded, "Hiragino Maru Gothic ProN", sans-serif`;
  const lines: string[] = [];
  let line = "";

  for (const char of text) {
    const candidate = line + char;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawSpeechBubble(caption: string): void {
  const padding = Math.max(22, canvas.width * 0.034);
  const fontSize = Math.max(28, Math.min(72, canvas.width * 0.06));
  const maxTextWidth = canvas.width * 0.7;
  const lines = wrapText(caption, maxTextWidth, fontSize);
  const lineHeight = fontSize * 1.25;
  const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
  const bubbleWidth = Math.min(canvas.width - padding * 2, textWidth + padding * 2);
  const bubbleHeight = lines.length * lineHeight + padding * 1.55;
  const placeTop = Math.random() > 0.38;
  const availableX = Math.max(1, canvas.width - bubbleWidth - padding * 2);
  const x = Math.random() * availableX + padding;
  const y = placeTop ? padding : canvas.height - bubbleHeight - padding - fontSize * 0.75;

  context.save();
  context.shadowColor = "rgba(76, 43, 54, 0.22)";
  context.shadowBlur = fontSize * 0.22;
  context.shadowOffsetY = fontSize * 0.1;
  roundedRect(x, y, bubbleWidth, bubbleHeight, fontSize * 0.45);
  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.fill();
  context.lineWidth = Math.max(4, fontSize * 0.075);
  context.strokeStyle = "#3b2930";
  context.stroke();

  context.shadowColor = "transparent";
  const tailX = x + bubbleWidth * (0.2 + Math.random() * 0.6);
  const direction = placeTop ? 1 : -1;
  const baseY = placeTop ? y + bubbleHeight : y;
  context.beginPath();
  context.moveTo(tailX - fontSize * 0.25, baseY);
  context.lineTo(tailX + fontSize * 0.12, baseY + direction * fontSize * 0.72);
  context.lineTo(tailX + fontSize * 0.46, baseY);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#3b2930";
  context.font = `900 ${fontSize}px ui-rounded, "Hiragino Maru Gothic ProN", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  lines.forEach((line, index) => {
    const textY = y + padding * 0.78 + lineHeight * (index + 0.5);
    context.fillText(line, x + bubbleWidth / 2, textY);
  });
  context.restore();
}

function render(caption = currentCaption || randomCaption()): void {
  if (!sourceImage) return;
  currentCaption = caption;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  drawSpeechBubble(caption);
}

function setReady(ready: boolean): void {
  rerollButton.disabled = !ready;
  applyButton.disabled = !ready;
  downloadButton.disabled = !ready;
}

function loadFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選択してください。");
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    sourceImage = image;
    fitCanvas(image);
    currentCaption = randomCaption();
    render(currentCaption);
    emptyState.hidden = true;
    canvas.hidden = false;
    setReady(true);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    alert("画像を読み込めませんでした。別の画像を試してください。");
  };
  image.src = objectUrl;
}

input.addEventListener("change", () => {
  const file = input.files?.[0];
  if (file) loadFile(file);
});

rerollButton.addEventListener("click", () => {
  captionInput.value = "";
  render(randomCaption());
});

applyButton.addEventListener("click", () => {
  const customCaption = captionInput.value.trim();
  render(customCaption || randomCaption());
});

captionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && sourceImage) applyButton.click();
});

downloadButton.addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `baby-speech-bubble-${Date.now()}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files[0];
  if (file) loadFile(file);
});
