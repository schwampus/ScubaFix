import { useRef, useState, useEffect } from "react";
import "./App.css";

export default function App() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const [originalPixels, setOriginalPixels] =
		useState<Uint8ClampedArray | null>(null);

	const [imageSize, setImageSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const [red, setRed] = useState<number>(1);
	const [green, setGreen] = useState<number>(1);
	const [blue, setBlue] = useState<number>(1);

	function handleUpload(e: React.ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0];
		if (!file) return;

		const img = new Image();
		img.src = URL.createObjectURL(file);

		img.onload = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const MAX_WIDTH = 1200;

			let width: number = img.width;
			let height: number = img.height;

			if (width > MAX_WIDTH) {
				const scale: number = MAX_WIDTH / width;
				width = MAX_WIDTH;
				height = Math.round(height * scale);
			}

			canvas.width = width;
			canvas.height = height;

			ctx.drawImage(img, 0, 0, width, height);

			const imageData = ctx.getImageData(0, 0, width, height);

			setOriginalPixels(new Uint8ClampedArray(imageData.data));
			setImageSize({ width, height });
		};
	}

	function renderWithAdjustments(): void {
		if (!originalPixels || !imageSize) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const { width, height } = imageSize;

		const outputPixels = new Uint8ClampedArray(originalPixels.length);

		for (let i = 0; i < originalPixels.length; i += 4) {
			outputPixels[i] = originalPixels[i] * red;
			outputPixels[i + 1] = originalPixels[i + 1] * green;
			outputPixels[i + 2] = originalPixels[i + 2] * blue;
			outputPixels[i + 3] = originalPixels[i + 3]; // keep alpha
		}

		const newImageData = new ImageData(outputPixels, width, height);
		ctx.putImageData(newImageData, 0, 0);
	}

	function fixColors(): void {
		if (!originalPixels || !imageSize) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const { width, height } = imageSize;

		const workingPixels = new Uint8ClampedArray(originalPixels);

		let totalR = 0;
		let totalG = 0;
		let totalB = 0;

		const pixelCount = workingPixels.length / 4;

		for (let i = 0; i < workingPixels.length; i += 4) {
			totalR += workingPixels[i];
			totalG += workingPixels[i + 1];
			totalB += workingPixels[i + 2];
		}

		const avgR = totalR / pixelCount;
		const avgG = totalG / pixelCount;
		const avgB = totalB / pixelCount;

		const target = (avgR + avgG + avgB) / 3;

		const scaleR = target / avgR;
		const scaleG = target / avgG;
		const scaleB = target / avgB;

		for (let i = 0; i < workingPixels.length; i += 4) {
			workingPixels[i] *= scaleR;
			workingPixels[i + 1] *= scaleG;
			workingPixels[i + 2] *= scaleB;
		}

		const newImageData = new ImageData(workingPixels, width, height);
		ctx.putImageData(newImageData, 0, 0);
	}

	function downloadImage(): void {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const link = document.createElement("a");
		link.download = "edited.jpg";
		link.href = canvas.toDataURL("image/jpeg", 0.9);
		link.click();
	}

	useEffect(() => {
		renderWithAdjustments();
	}, [red, green, blue, originalPixels]);

	return (
		<div style={{ padding: 20 }}>
			<h1>Scuba-Pic-Fix</h1>
			<div>
				<input type="file" accept="image/*" onChange={handleUpload} />
			</div>
			<div>
				<button onClick={fixColors}>Fix Colors With Magic</button>
			</div>

			<div>
				<label>Red</label>
				<input
					type="range"
					min="0"
					max="3"
					step="0.01"
					value={red}
					onChange={(e) => setRed(Number(e.target.value))}
				/>

				<label>Green</label>
				<input
					type="range"
					min="0"
					max="3"
					step="0.01"
					value={green}
					onChange={(e) => setGreen(Number(e.target.value))}
				/>

				<label>Blue</label>
				<input
					type="range"
					min="0"
					max="3"
					step="0.01"
					value={blue}
					onChange={(e) => setBlue(Number(e.target.value))}
				/>
			</div>

			<canvas ref={canvasRef} style={{ maxWidth: "100%", marginTop: 20 }} />
			<div>
				<button onClick={downloadImage}>Download Corrected Image</button>
			</div>
		</div>
	);
}
