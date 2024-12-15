import { Component, OnInit } from '@angular/core';
import { PokeApiService } from '../services/poke-api.service';
import { Router } from '@angular/router';
import { Pokemon } from '../models/pokemon.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  pokemonList: Pokemon[] = [];
  loading = false;

  constructor(
    private pokeApiService: PokeApiService,
    private router: Router) {}

  ngOnInit() {
    this.fetchPokemons();
  }

  fetchPokemons() {
    this.loading = true;
    this.pokeApiService.getPokemonList(0, 151).subscribe(
      (response: any) => {
        this.pokemonList = response.results.map((pokemon: any) => {
          const id = pokemon.url.split('/').slice(-2)[0]; // Extraer el ID de la URL
          return {
            id: id, // Ahora incluimos 'id'
            name: pokemon.name,
            url: pokemon.url,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
          };
        });
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching Pokémon:', error);
        this.loading = false;
      }
    );
  }
  
  

  viewDetails(pokemon: any) {
    const id = pokemon.url.split('/').slice(-2)[0]; // Extraer el ID de la URL
    this.router.navigate([`/pokemon-details/${id}`]);
  }
}
