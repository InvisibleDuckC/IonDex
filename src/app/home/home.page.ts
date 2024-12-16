import { Component, OnInit } from '@angular/core';
import { PokeApiService } from '../services/poke-api.service';
import { Router } from '@angular/router';
import { Pokemon } from '../models/pokemon.model';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  pokemonList: Pokemon[] = [];
  filteredPokemon: Pokemon[] = [];
  loading = false;

  searchTerm: string = '';
  selectedType: string = '';
  selectedGeneration: number | '' = '';
  allTypes: string[] = [];
  allGenerations: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor(private pokeApiService: PokeApiService, private router: Router) {}

  ngOnInit() {
    this.fetchPokemons();
    this.fetchTypes();
  }

  fetchPokemons() {
    this.loading = true; // Activar spinner
    const batchSize = 200;
    const totalPokemon = 1010; // Total de Pokémon disponibles
    const requests: Observable<any>[] = [];

    for (let offset = 0; offset < totalPokemon; offset += batchSize) {
      requests.push(this.pokeApiService.getPokemonList(offset, batchSize));
    }

    forkJoin(requests).subscribe(
      (responses: any[]) => {
        this.pokemonList = responses.reduce((acc: any[], response: any) => {
          const pokemons = response.results.map((pokemon: any) => {
            const id = pokemon.url.split('/').slice(-2)[0];
            return {
              id: id,
              name: pokemon.name,
              url: pokemon.url,
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
              types: [],
              generation: this.getGeneration(id),
            };
          });
          return acc.concat(pokemons);
        }, []);

        this.filteredPokemon = [...this.pokemonList];
        this.pokemonList.forEach((pokemon) => this.fetchDetails(pokemon));
        this.loading = false; // Desactivar spinner
      },
      (error: any) => {
        console.error('Error fetching Pokémon:', error);
        this.loading = false; // Desactivar spinner incluso si hay un error
      }
    );
  }
  

  fetchDetails(pokemon: Pokemon) {
    this.pokeApiService.getPokemonDetails(pokemon.id).subscribe({
      next: (details: any) => {
        pokemon.types = details.types.map((t: any) => t.type.name);
      },
      error: (err) => console.error(`Error fetching details for Pokémon ${pokemon.name}:`, err),
    });
  }

  fetchTypes() {
    this.pokeApiService.getAllTypes().subscribe(
      (types: any[]) => {
        this.allTypes = types.map((type: any) => type.name);
      },
      (error: any) => {
        console.error('Error fetching types:', error);
      }
    );
  }

  filterPokemon() {
    this.filteredPokemon = this.pokemonList.filter((pokemon) => {
      const matchesName = pokemon.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = this.selectedType ? pokemon.types.includes(this.selectedType) : true;
      const matchesGeneration = this.selectedGeneration
        ? pokemon.generation === this.selectedGeneration
        : true;

      return matchesName && matchesType && matchesGeneration;
    });
  }

  viewDetails(pokemon: Pokemon) {
    this.router.navigate([`/pokemon-details/${pokemon.id}`]);
  }

  getGeneration(id: number): string {
    if (id <= 151) return 'Gen 1';
    if (id <= 251) return 'Gen 2';
    if (id <= 386) return 'Gen 3';
    if (id <= 493) return 'Gen 4';
    if (id <= 649) return 'Gen 5';
    if (id <= 721) return 'Gen 6';
    if (id <= 809) return 'Gen 7';
    return 'Gen 8';
  }
}
