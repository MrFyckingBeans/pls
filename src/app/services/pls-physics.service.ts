import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlsPhysicsService {
  // Constants for flight modes
  private readonly sinkRateBrake100 = -2;
  private readonly forwardSpeedBrake100 = 6;
  private readonly sinkRateBrake25 = -3;
  private readonly forwardSpeedBrake25 = 10;
  private readonly sinkRateBrake0 = -4;
  private readonly forwardSpeedBrake0 = 12;
  private readonly sinkRateAccelerated = -6;
  private readonly forwardSpeedAccelerated = 15;

  private sinkRate = new BehaviorSubject<number>(this.sinkRateBrake0); // Default sink rate
  private forwardSpeed = new BehaviorSubject<number>(this.forwardSpeedBrake0); // Default forward speed
  private windStrength = new BehaviorSubject<number>(0); // Default wind strength
  private windDirection = new BehaviorSubject<string>('headwind'); // Default wind direction
  private initialForwardSpeed = this.forwardSpeedBrake0; // Store initial forward speed

  setBrakeInput(brakeInput: number) {
    const newSinkRate = this.calculateSinkRate(brakeInput);
    let newForwardSpeed = this.calculateForwardSpeed(brakeInput);
    this.initialForwardSpeed = newForwardSpeed; // Store initial forward speed based on brake input
    this.sinkRate.next(newSinkRate);
    this.applyWindEffect(); // Apply wind effect on the initial forward speed
  }  

  setWindStrength(windStrength: number) {
    this.windStrength.next(windStrength);
  }
  
  getWindStrength(): Observable<number> {
    return this.windStrength.asObservable();
  }

  setWindDirection(windDirection: string) {
    this.windDirection.next(windDirection);
  }
  
  getWindDirection(): Observable<string> {
    return this.windDirection.asObservable();
  }
  
  

  applyWindEffect() {
    const adjustedForwardSpeed = this.calculateWindAdjustedSpeed(this.initialForwardSpeed);
    this.forwardSpeed.next(adjustedForwardSpeed);
  }
  

  private calculateWindAdjustedSpeed(forwardSpeed: number): number {
    const windStrength = this.windStrength.getValue();
    const windDirection = this.windDirection.getValue();
    return windDirection === 'tailwind' ? forwardSpeed + windStrength : forwardSpeed - windStrength;
  }

  calculateSinkRate(brakeInput: number): number {
    if (brakeInput <= 0) {
      return this.sinkRateBrake0 + (brakeInput * (this.sinkRateAccelerated - this.sinkRateBrake0) / -100);
    } else if (brakeInput <= 25) {
      return this.sinkRateBrake0 + (brakeInput * (this.sinkRateBrake25 - this.sinkRateBrake0) / 25);
    } else {
      return this.sinkRateBrake25 + ((brakeInput - 25) * (this.sinkRateBrake100 - this.sinkRateBrake25) / 75);
    }
  }

  calculateForwardSpeed(brakeInput: number): number {
    if (brakeInput <= 0) {
      return this.forwardSpeedBrake0 + (brakeInput * (this.forwardSpeedAccelerated - this.forwardSpeedBrake0) / -100);
    } else if (brakeInput <= 25) {
      return this.forwardSpeedBrake0 + (brakeInput * (this.forwardSpeedBrake25 - this.forwardSpeedBrake0) / 25);
    } else {
      return this.forwardSpeedBrake25 + ((brakeInput - 25) * (this.forwardSpeedBrake100 - this.forwardSpeedBrake25) / 75);
    }
  }

  getSinkRate(): Observable<number> {
    return this.sinkRate.asObservable();
  }

  getForwardSpeed(): Observable<number> {
    return this.forwardSpeed.asObservable();
  }

  getGlideRatios(): { brake100: number, brake25: number, brake0: number, current: number, accelerated: number } {
    const windStrength = this.windStrength.getValue();
    const windDirection = this.windDirection.getValue();
    const windAdjustment = windDirection === 'tailwind' ? windStrength : -windStrength;

    return {
      brake100: (this.forwardSpeedBrake100 + windAdjustment) / -this.sinkRateBrake100,
      brake25: (this.forwardSpeedBrake25 + windAdjustment) / -this.sinkRateBrake25,
      brake0: (this.forwardSpeedBrake0 + windAdjustment) / -this.sinkRateBrake0,
      current: (this.forwardSpeed.value + windAdjustment) / -this.sinkRate.value,
      accelerated: (this.forwardSpeedAccelerated + windAdjustment) / -this.sinkRateAccelerated
    };
  }

  calculateLandingPoints(heightInMeters: number, flownDistanceInMeters: number, glideRatio: number) {
    const glideRatios = this.getGlideRatios();

    const landingPointInMeters100Brake = heightInMeters * glideRatios.brake100;
    const landingPointInMeters25Brake = heightInMeters * glideRatios.brake25;
    const landingPointInMeters0Brake = heightInMeters * glideRatios.brake0;
    const landingPointInMeters100Accelerator = heightInMeters * glideRatios.accelerated;
    const landingPointInMetersCurrentGlideRatio = heightInMeters * glideRatio;

    return {
      totalLandingPointInMeters100Brake: flownDistanceInMeters + landingPointInMeters100Brake,
      totalLandingPointInMeters25Brake: flownDistanceInMeters + landingPointInMeters25Brake,
      totalLandingPointInMeters0Brake: flownDistanceInMeters + landingPointInMeters0Brake,
      totalLandingPointInMeters100Accelerator: flownDistanceInMeters + landingPointInMeters100Accelerator,
      totalLandingPointInMetersCurrentGlideRatio: flownDistanceInMeters + landingPointInMetersCurrentGlideRatio
    };
  }
}
