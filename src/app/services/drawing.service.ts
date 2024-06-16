import { Injectable } from '@angular/core';

interface GroundFeature {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: HTMLImageElement;
}


@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private parachuteImage: HTMLImageElement;

  
  private groundFeatures: GroundFeature[] = [
    { src: 'assets/treeEmoji3.png', x: 200, y: 450, width: 40, height: 40 },
    { src: 'assets/treeEmoji3.png', x: 400, y: 420, width: 40, height: 40 },
    { src: 'assets/treeEmoji3.png', x: 600, y: 455, width: 40, height: 40 },
    { src: 'assets/emojiPond1.png', x: 300, y: 425, width: 60, height: 60 },
  ];
  
  

  constructor() {
    // Load the parachute image
    this.parachuteImage = new Image();
    this.parachuteImage.src = 'assets/parachute.png'; 
  
    // Load the images for ground features
    this.groundFeatures.forEach(feature => {
      const image = new Image();
      image.src = feature.src;
      feature.image = image; // Attach the loaded image to the feature object
    });
  }
  

  drawLandingIndicator(ctx: CanvasRenderingContext2D, scale: number, canvasHeight: number, padding: number, positionX: number, positionY: number, landingPoints: any) {
    const { totalLandingPointInMeters100Brake, totalLandingPointInMeters25Brake, totalLandingPointInMeters0Brake, totalLandingPointInMeters100Accelerator, totalLandingPointInMetersCurrentGlideRatio } = landingPoints;

    // Convert landing points to pixels
    const landingPointInPixels100Brake = 100 + totalLandingPointInMeters100Brake * scale;
    const landingPointInPixels25Brake = 100 + totalLandingPointInMeters25Brake * scale;
    const landingPointInPixels0Brake = 100 + totalLandingPointInMeters0Brake * scale;
    const landingPointInPixels100Accelerator = 100 + totalLandingPointInMeters100Accelerator * scale;
    const landingPointInPixelsCurrentGlideRatio = 100 + totalLandingPointInMetersCurrentGlideRatio * scale;

    const points = [
      { x: landingPointInPixels100Brake, y: canvasHeight - padding, label: 'S', color: '#0077B6' },
      { x: landingPointInPixels25Brake, y: canvasHeight - padding, label: 'G', color: '#FF6E00' },
      { x: landingPointInPixels0Brake, y: canvasHeight - padding, label: 'F', color: '#008000' },
      { x: landingPointInPixels100Accelerator, y: canvasHeight - padding, label: 'T', color: '#8800FF' },
      { x: landingPointInPixelsCurrentGlideRatio, y: canvasHeight - padding, label: '', color: '#FFEE00' }
    ];

    // Detect and adjust for overlapping points
    this.adjustForOverlap(points, canvasHeight, padding);

    // Draw the lines from the parachute to the landing points
    ctx.strokeStyle = '#808080'; // Grey color for lines
    points.forEach(point => {
      ctx.beginPath();
      ctx.moveTo(positionX, positionY-10);
      ctx.lineTo(point.x, canvasHeight - padding); // Draw line to the ground level (original y value)
      ctx.stroke();
    });

    // Fill the sector between the most divergent points
    points.sort((a, b) => a.x - b.x);
    const leftmost = points[0];
    const rightmost = points[points.length - 1];
    ctx.fillStyle = 'rgba(135, 206, 250, 0.2)'; // Light blue color with transparency
    ctx.beginPath();
    ctx.moveTo(positionX, positionY -10);
    ctx.lineTo(leftmost.x, canvasHeight - padding);
    ctx.lineTo(rightmost.x, canvasHeight - padding);
    ctx.closePath();
    ctx.fill();

    // Draw the landing indicators and labels
    points.forEach(point => {
      this.drawIndicatorWithLabel(ctx, point.x, point.y, point.color, point.label);
    });
  }

  private drawIndicatorWithLabel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
    const radius = 11; // Increased radius
    ctx.beginPath();
    ctx.arc(x, y+0, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF'; // White color for text
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y); // Position the text inside the circle
  }

  private adjustForOverlap(points: { x: number, y: number, label: string, color: string }[], canvasHeight: number, padding: number) {
    const radius = 11; // Radius of the indicators
    const spacing = radius * 2; // Spacing between indicators to avoid overlap

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].x === points[j].x && points[i].y === points[j].y) {
          points[j].y += spacing; // Move the overlapping point down
        }
      }
    }
  }


  drawParachute(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const adjustedY = y -10; // -20 Move the parachute into the depth by adjusting the Y coordinate
    const adjustedX = x ; // +10 Move the parachute into the depth by adjusting the x coordinate

    if (this.parachuteImage.complete) {
      ctx.drawImage(this.parachuteImage, adjustedX - 25, adjustedY - 35, 50, 50); // Adjust the size and position as needed
    } else {
      this.parachuteImage.onload = () => {
        ctx.drawImage(this.parachuteImage, adjustedX - 25, adjustedY - 35, 50, 50); // Adjust the size and position as needed
      };
    }
  }
  

  drawLandingZone(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, padding: number) {
    // Coordinates for the center of the landing zone
    const landingZoneX = canvasWidth / 1.2;
    const landingZoneY = canvasHeight - padding; // Position on the ground axis

    // Draw the landing zone (simple circle)
    ctx.beginPath();
    ctx.arc(landingZoneX, landingZoneY-20, 25, 0, Math.PI * 2, true); // Circle with radius 25 pixels
    ctx.fillStyle = '#808080'; // Gray color for gravel
    ctx.fill();
    ctx.closePath();

    // Draw the yellow cross in the middle of the landing zone
    ctx.strokeStyle = '#FFFF00'; // Yellow color for the cross
    ctx.lineWidth = 6; // Set the width of the cross lines

    // Draw the horizontal line of the cross
    ctx.beginPath();
    ctx.moveTo(landingZoneX - 10, landingZoneY-20);
    ctx.lineTo(landingZoneX + 10, landingZoneY-20);
    ctx.stroke();

    // Draw the vertical line of the cross
    ctx.beginPath();
    ctx.moveTo(landingZoneX, landingZoneY - 30);
    ctx.lineTo(landingZoneX, landingZoneY - 10);
    ctx.stroke();

    // Reset the line width to default
    ctx.lineWidth = 1;
  }


  drawGroundAxis(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, padding: number, scale: number) {
    // Draw the grass ground
    this.drawGrassGround(ctx, canvasWidth, canvasHeight, padding);

    // Coordinates for the ground axis
    const groundY = canvasHeight - padding;

    // Draw the ground axis line
    ctx.beginPath();
    ctx.moveTo(padding, groundY);
    ctx.lineTo(canvasWidth - padding, groundY);
    ctx.strokeStyle = '#000000'; // Black color for the axis line
    ctx.stroke();

    // Draw the markers every 50 meters (250 pixels)
    const largeMarkerInterval = 50 * scale;
    for (let x = padding; x <= canvasWidth - padding; x += largeMarkerInterval) {
      ctx.beginPath();
      ctx.moveTo(x, groundY - 5); // Large marker length: 5 pixels above the axis
      ctx.lineTo(x, groundY + 5); // Large marker length: 5 pixels below the axis
      ctx.strokeStyle = '#000000'; // Black color for the markers
      ctx.stroke();

      // Draw the label for the large marker
      const label = ((x - padding) / scale).toFixed(0);
      ctx.fillStyle = '#000000';
      ctx.fillText(label + 'm', x - 10, groundY + 20); // Adjust the position of the label
    }

    // Draw the smaller markers every 10 meters (50 pixels)
    const smallMarkerInterval = 10 * scale;
    for (let x = padding; x <= canvasWidth - padding; x += smallMarkerInterval) {
      // Skip drawing a small marker if it's at the position of a large marker
      if ((x - padding) % largeMarkerInterval !== 0) {
        ctx.beginPath();
        ctx.moveTo(x, groundY - 3); // Small marker length: 3 pixels above the axis
        ctx.lineTo(x, groundY + 3); // Small marker length: 3 pixels below the axis
        ctx.strokeStyle = '#000000'; // Black color for the markers
        ctx.stroke();
      }
    }

    // Draw the trees on the landscape
    this.drawGroundFeatures(ctx);

    // Draw the vertical axis
    this.drawVerticalAxis(ctx, canvasHeight, padding, scale);

     
  }

  private drawVerticalAxis(ctx: CanvasRenderingContext2D, canvasHeight: number, padding: number, scale: number) {
    const groundY = canvasHeight - padding;

    // Draw the vertical axis line
    ctx.beginPath();
    ctx.moveTo(padding, groundY);
    ctx.lineTo(padding, padding);
    ctx.strokeStyle = '#000000'; // Black color for the axis line
    ctx.stroke();

    // Draw the markers every 10 meters (50 pixels)
    const markerInterval = 10 * scale;
    for (let y = groundY; y >= padding; y -= markerInterval) {
      ctx.beginPath();
      ctx.moveTo(padding - 5, y); // Marker length: 5 pixels left of the axis
      ctx.lineTo(padding + 5, y); // Marker length: 5 pixels right of the axis
      ctx.strokeStyle = '#000000'; // Black color for the markers
      ctx.stroke();

      // Draw the label for the marker
      const label = ((groundY - y) / scale).toFixed(0);
      ctx.fillStyle = '#000000';
      ctx.fillText(label + 'm', padding - 25, y + 5); // Adjust the position of the label
    }
  }

  private drawGrassGround(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, padding: number) {
    // Draw the grass ground
    ctx.fillStyle = '#c0f098'; // Green color for grass
    const groundY = canvasHeight - padding;
    ctx.beginPath();
    ctx.moveTo(padding, groundY);
    ctx.lineTo(canvasWidth - padding, groundY);
    ctx.lineTo(canvasWidth - padding + 25, groundY - 50);
    ctx.lineTo(padding + 50, groundY - 50);
    ctx.closePath();
    ctx.fill();
}

private drawGroundFeatures(ctx: CanvasRenderingContext2D) {
  const drawFeature = (image: HTMLImageElement, x: number, y: number, width: number, height: number) => {
    ctx.drawImage(image, x, y, width, height);
  };

  this.groundFeatures.forEach(feature => {
    if (feature.image) {
      const img = feature.image as HTMLImageElement;
      if (img.complete) {
        drawFeature(img, feature.x, feature.y, feature.width, feature.height);
      } else {
        img.onload = () => {
          drawFeature(img, feature.x, feature.y, feature.width, feature.height);
        };
      }
    }
  });
}


}
