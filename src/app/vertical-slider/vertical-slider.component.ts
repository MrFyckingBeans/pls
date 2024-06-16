import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-vertical-slider',
  standalone: true,
  imports: [],
  templateUrl: './vertical-slider.component.html',
  styleUrl: './vertical-slider.component.scss'
})
export class VerticalSliderComponent {
  @Input() min = 0;
  @Input() max = 100;
  @Input() value = 0;
  @Input() label = '';

  @Output() valueChange = new EventEmitter<number>();

  onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.value = +inputElement.value;
    this.valueChange.emit(this.value);
  }
}
