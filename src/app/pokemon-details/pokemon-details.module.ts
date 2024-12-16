import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PokemonDetailsPageRoutingModule } from './pokemon-details-routing.module';

import { PokemonDetailsPage } from './pokemon-details.page';
import { FilterByMultiplierPipe } from '../shared/pipes/filter-by-multiplier.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PokemonDetailsPageRoutingModule
  ],
  declarations: [PokemonDetailsPage, FilterByMultiplierPipe]
})
export class PokemonDetailsPageModule {}
