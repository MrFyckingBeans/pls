import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PlsPhysicsService } from '../services/pls-physics.service';
import { DrawingService } from '../services/drawing.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-pls',
  standalone: true,
  imports: [],
  templateUrl: './pls.component.html',
  styleUrls: ['./pls.component.scss']
})
export class PlsComponent implements OnInit {
  @ViewChild('simulationCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  public ctx: CanvasRenderingContext2D | null = null;
  public canvasHeight = 600; // Canvas height in pixels
  public canvasWidth = 1500; // Canvas width in pixels
  public padding = 100; // Padding in pixels

  // Simulation state
  public positionX = 100; // Starting X position in pixels
  public positionY: number = 0; // Y position in pixels
  public landed: boolean = false; // Flag to indicate if the parachute has landed
  public lastTimestamp = 0; // Timestamp of the last frame
  public showOverlay = true; // Property to control overlay visibility
  public gameStarted = false; // Property to indicate if the game has started
  public brakeValue: number = 0; // Slider value

  // Physics parameters
  public scale = 5; // 5 pixels per meter
  public initialHeight = 80; // Initial height in meters
  public sinkRate = -4; // Default sink rate in meters per second
  public forwardSpeed = 12; // Default forward speed in meters per second
  public glideRatio = 3;
  public brakeInput: number = 0;
  public acceleratorInput: number = 0;

  // Wind parameters
  public windStrength: number = 0; // Default wind strength in m/s
  public windDirection: string = 'headwind'; // Default wind direction

  // Rounded values for display
  public roundedSinkRate: string = this.sinkRate.toFixed(2);
  public roundedForwardSpeed: string = this.forwardSpeed.toFixed(2);

  // Pause state
  public paused: boolean = false;

  constructor(private physicsService: PlsPhysicsService, private drawingService: DrawingService) {}

  ngOnInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.setupEventListeners(); // Set up event listeners for keypress

    if (this.ctx) {
      // Initialize wind settings
      this.physicsService.getWindDirection().subscribe(direction => {
        this.windDirection = direction;
      });
      this.physicsService.getWindStrength().subscribe(strength => {
        this.windStrength = strength;
      });

      // Convert initial height to pixel coordinates
      this.positionY = this.canvasHeight - (this.initialHeight * this.scale) - this.padding;
      this.drawScene(); // Draw initial scene
      this.drawLandingIndicator(); // Draw the initial landing indicator

      // Subscribe to changes in sink rate and forward speed
      combineLatest([
        this.physicsService.getSinkRate(),
        this.physicsService.getForwardSpeed()
      ]).subscribe(([sinkRate, forwardSpeed]) => {
        this.sinkRate = sinkRate;
        this.forwardSpeed = forwardSpeed;
        this.roundedSinkRate = this.sinkRate.toFixed(2);
        this.roundedForwardSpeed = this.forwardSpeed.toFixed(2);
        this.updateGlideRatio();
        this.drawLandingIndicator(); // Update the landing indicator
      });
    }
  }

  setupEventListeners() {
    // Listen for space bar key press
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        this.togglePause();
      }
    });
  }

  togglePause() {
    // Toggle the paused state
    this.paused = !this.paused;

    if (!this.paused && !this.landed) {
      // If it's not paused and hasn't landed, continue the animation
      this.lastTimestamp = performance.now();
      requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
  }

  animate(timestamp: number) {
    if (this.landed || this.paused) return;
    
    const elapsed = timestamp - this.lastTimestamp; // Time elapsed since the last frame in milliseconds
    this.lastTimestamp = timestamp;

    // Update the positions based on the elapsed time
    const sinkRatePxPerMs = (this.sinkRate / 1000) * this.scale; // Convert sink rate to pixels per millisecond
    const forwardSpeedPxPerMs = (this.forwardSpeed / 1000) * this.scale; // Convert forward speed to pixels per millisecond

    this.positionY -= sinkRatePxPerMs * elapsed;
    this.positionX += forwardSpeedPxPerMs * elapsed;

    if (this.positionY < this.canvasHeight - this.padding) {
      this.drawScene(); // Redraw the entire scene
      requestAnimationFrame((timestamp) => this.animate(timestamp)); // Continue the animation loop
    } else {
      this.landed = true; // Set landed flag to true
      this.showOverlay = true; // Show overlay for restart
      console.log('Parachute has landed');
    }
  }

  startSimulation() {
    this.showOverlay = false; // Hide overlay when simulation starts
    this.gameStarted = true; // Mark the game as started
    this.landed = false; // Reset landed flag
    this.positionX = 100; // Reset X position
    this.positionY = this.canvasHeight - (this.initialHeight * this.scale) - this.padding; // Reset Y position
    this.brakeValue = 0;
    this.physicsService.setBrakeInput(this.brakeValue); // Reset brake input to default
    this.lastTimestamp = performance.now();
    this.physicsService.applyWindEffect(); // Apply wind effect on forward speed
    this.animate(this.lastTimestamp); // Start the animation loop
  }
  

  onBrakeInputChange(event: any) {
    this.brakeValue = +event.target.value; // Update the slider value
    this.physicsService.setBrakeInput(this.brakeValue);
    this.getBrakeAcceleratorInputs();
  }
  

  onWindStrengthChange(event: any) {
    this.windStrength = +event.target.value; // Update wind strength
    this.physicsService.setWindStrength(this.windStrength);
  }

  onWindDirectionChange(event: any) {
    this.windDirection = event.target.value; // Update wind direction
    this.physicsService.setWindDirection(this.windDirection);
  }

  getBrakeAcceleratorInputs() {
    if (this.brakeValue <= 0) {
      this.brakeInput = -this.brakeValue;
      this.acceleratorInput = 0;
    } else if (this.brakeValue >= 0) {
      this.acceleratorInput = this.brakeValue;
      this.brakeInput = 0;
    }
  }

  updateGlideRatio() {
    this.glideRatio = parseFloat((this.forwardSpeed / -this.sinkRate).toFixed(2));
  }

  getHeightInMeters(): number {
    return (this.canvasHeight - this.positionY - this.padding) / this.scale;
  }
  
  getRoundedHeightInMeters(): number {
    return Math.round(this.getHeightInMeters());
  }

  drawLandingIndicator() {
    if (!this.ctx) return;
  
    const heightInMeters = this.getHeightInMeters();
    const flownDistanceInMeters = (this.positionX - 100) / this.scale;
    const landingPoints = this.physicsService.calculateLandingPoints(heightInMeters, flownDistanceInMeters, this.glideRatio);
  
    this.drawingService.drawLandingIndicator(this.ctx, this.scale, this.canvasHeight, this.padding, this.positionX, this.positionY, landingPoints);
  }
  

  drawScene() {
    if (!this.ctx) return;

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    // Draw the ground axis and landing zone
    this.drawingService.drawGroundAxis(this.ctx, this.canvasWidth, this.canvasHeight, this.padding, this.scale);
    this.drawingService.drawLandingZone(this.ctx, this.canvasWidth, this.canvasHeight, this.padding);

    // Draw the parachute
    this.drawingService.drawParachute(this.ctx, this.positionX, this.positionY);

    // Draw the landing indicator
    this.drawLandingIndicator();
  }
}
