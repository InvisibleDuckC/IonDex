import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokeApiService } from '../services/poke-api.service';
import { LevelUpMove } from '../models/pokemon.model';

@Component({
  selector: 'app-pokemon-details',
  templateUrl: './pokemon-details.page.html',
  styleUrls: ['./pokemon-details.page.scss'],
})
export class PokemonDetailsPage implements OnInit {
  description: string = '';
  habitat: string = '';
  shape: string = '';
  evolutionChain: { 
    name: string; 
    id: string; 
    conditions: string[]; 
    sprite: string 
  }[] = [];
  weaknesses: string[] = [];
  strengths: string[] = [];
  resistances: string[] = [];
  inefficiencies: string[] = [];
  pokemonDetails: any = null;
  abilityDetails: any[] = [];
  categorizedMoves: { [key: string]: any[] } = {
    'level-up': [],
    machine: [],
    tutor: [],
    egg: [],
    other: [],
  };

  constructor(
    private route: ActivatedRoute,
    private pokeApiService: PokeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Pokemon ID:', id);

    if (id) {
      this.loadPokemonDetails(id);
      this.loadPokemonSpecies(id);
    } else {
      console.error('No ID found in route');
    }
  }

  // Cargar detalles del Pokémon
  loadPokemonDetails(id: string) {
    this.pokeApiService.getPokemonDetails(id).subscribe({
      next: (details) => {
        console.log('Pokemon Details:', details);
        this.pokemonDetails = details;
        this.loadTypeRelations(details.types || []); // Relación de tipos
        this.processAbilities(details.abilities || []); // Procesar habilidades
        this.categorizeMoves(details.moves || []); // Procesar movimientos
        this.cdr.detectChanges(); // Forzar actualización de la vista
      },
      error: (err) => {
        console.error('Error fetching Pokemon details:', err);
      },
    });
  }

  // Cargar datos de la especie del Pokémon
  loadPokemonSpecies(id: string) {
    this.pokeApiService.getPokemonSpecies(id).subscribe({
      next: (species) => {
        if (!species) {
          console.warn('No species data available');
          return;
        }

        // Descripción, hábitat y forma
        this.description = species.flavor_text_entries?.find(
          (entry: any) => entry.language.name === 'en'
        )?.flavor_text.replace(/\n|\f/g, ' ') || 'No description available.';
        this.habitat = species.habitat?.name || 'Unknown';
        this.shape = species.shape?.name || 'Unknown';

        // Cargar cadena evolutiva
        if (species.evolution_chain?.url) {
          const evolutionChainId = Number(species.evolution_chain.url.split('/').slice(-2)[0]); // Convertir a número
          this.loadEvolutionChain(evolutionChainId);
        }

        this.cdr.detectChanges(); // Forzar actualización de la vista
      },
      error: (err) => {
        console.error('Error fetching species data:', err);
      },
    });
  }

  // Procesar habilidades
  processAbilities(abilities: any[]) {
    abilities.forEach((ability: any) => {
      if (ability.ability && ability.ability.name) {
        this.pokeApiService.getAbilityDetails(ability.ability.name).subscribe({
          next: (abilityInfo) => {
            const effectEntry = abilityInfo.effect_entries.find(
              (e: any) => e.language.name === 'en'
            );
            this.abilityDetails.push({
              name: abilityInfo.name,
              effect: effectEntry?.effect || 'No effect available.',
              shortEffect: effectEntry?.short_effect || 'No short effect available.',
            });
            this.cdr.detectChanges(); // Actualizar vista al cargar habilidad
          },
          error: (err) => {
            console.error(`Failed to fetch details for ability: ${ability.ability.name}`, err);
          },
        });
      } else {
        console.warn('Ability name is undefined or invalid:', ability);
      }
    });
  }

  // Cargar cadena evolutiva
  loadEvolutionChain(evolutionChainId: number) {
    this.pokeApiService.getEvolutionChain(evolutionChainId).subscribe({
      next: (evolution) => {
        if (evolution?.chain) {
          this.evolutionChain = this.processEvolutionChain(evolution.chain);
          console.log('Processed Evolution Chain:', this.evolutionChain);
          this.cdr.detectChanges(); // Actualizar vista tras procesar cadena evolutiva
        } else {
          console.warn('No evolution chain data available');
        }
      },
      error: (err) => {
        console.error('Error fetching evolution chain:', err);
      },
    });
  }

  // Procesar relaciones de tipos
  loadTypeRelations(types: any[]) {
    const typeNames = types.map((type: any) => type.type.name);

    typeNames.forEach((typeName: string) => {
      this.pokeApiService.getTypeDetails(typeName).subscribe({
        next: (typeDetails: any) => {
          if (typeDetails.damage_relations) {
            typeDetails.damage_relations.double_damage_from.forEach((type: any) => {
              if (!this.weaknesses.includes(type.name)) this.weaknesses.push(type.name);
            });
            typeDetails.damage_relations.double_damage_to.forEach((type: any) => {
              if (!this.strengths.includes(type.name)) this.strengths.push(type.name);
            });
          } else {
            console.warn(`Type details missing damage relations for ${typeName}`);
          }
          this.cdr.detectChanges(); // Actualizar vista al cargar relaciones de tipo
        },
        error: (err) => {
          console.error(`Error fetching type details for ${typeName}:`, err);
        },
      });
    });
  }

  // Procesar cadena evolutiva
  processEvolutionChain(chain: any): any[] {
    const evolution: any[] = [];
    if (!chain || typeof chain !== 'object') {
      console.warn('Invalid chain data provided');
      return evolution;
    }
  
    try {
      const conditions: string[] = [];
      if (Array.isArray(chain.evolution_details)) {
        chain.evolution_details.forEach((detail: any) => {
          if (detail.min_level) conditions.push(`Evolves at level ${detail.min_level}`);
          if (detail.item) conditions.push(`Requires item: ${detail.item.name}`);
          if (detail.trigger && detail.trigger.name) conditions.push(`Trigger: ${detail.trigger.name}`);
          if (detail.known_move_type) conditions.push(`Requires move type: ${detail.known_move_type.name}`);
          if (detail.location) conditions.push(`Requires location: ${detail.location.name}`);
          if (detail.min_happiness) conditions.push(`Requires happiness of ${detail.min_happiness}`);
          if (detail.min_affection) conditions.push(`Requires affection of ${detail.min_affection}`);
          if (detail.gender === 1) conditions.push(`Female only`);
          if (detail.gender === 2) conditions.push(`Male only`);
          if (detail.turn_upside_down) conditions.push(`Flip device upside down`);
        });
      }
  
      if (chain.species && chain.species.url) {
        const id = chain.species.url.split('/').slice(-2)[0];
        evolution.push({
          name: chain.species.name,
          id: id,
          conditions: [...conditions],
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        });
      }
  
      if (Array.isArray(chain.evolves_to) && chain.evolves_to.length > 0) {
        chain.evolves_to.forEach((nextChain: any) => {
          const nextEvolutions = this.processEvolutionChain(nextChain);
          if (Array.isArray(nextEvolutions)) {
            evolution.push(...nextEvolutions);
          } else {
            console.error('Unexpected result from processEvolutionChain:', nextEvolutions);
          }
        });
      }
    } catch (error) {
      console.error('Error processing evolution chain:', error);
    }
  
    return evolution;
  }
  

  categorizeMoves(moves: any[]) {
    const seenMoves: { [key: string]: Set<string> } = {
      'level-up': new Set(),
      machine: new Set(),
      tutor: new Set(),
      egg: new Set(),
      other: new Set(),
    };

    moves.forEach((move) => {
      move.version_group_details.forEach((vgd: any) => {
        const method = vgd.move_learn_method?.name;

        if (!method) {
          console.warn('Move learn method is undefined:', vgd);
          return;
        }

        // Si no existe la categoría, se crea
        if (!seenMoves[method]) seenMoves[method] = new Set();
        if (!this.categorizedMoves[method]) this.categorizedMoves[method] = [];

        // Evitar duplicados
        if (!seenMoves[method].has(move.move.name)) {
          seenMoves[method].add(move.move.name);

          this.pokeApiService.getMoveDetails(move.move.name).subscribe({
            next: (moveDetails) => {
              const damageClass = moveDetails.damage_class?.name || 'unknown';
              const damageClassIcon = `assets/attack-icons/${damageClass}.gif`;

              this.categorizedMoves[method].push({
                name: move.move.name,
                type: moveDetails.type.name,
                typeIcon: `assets/type-icons/${moveDetails.type.name}.png`,
                power: moveDetails.power || 'N/A',
                pp: moveDetails.pp || 'N/A',
                accuracy: moveDetails.accuracy || 'N/A',
                damageClass: damageClass,
                damageClassIcon: damageClassIcon,
              });

              // Ordenar movimientos por nombre
              this.categorizedMoves[method].sort((a, b) => a.name.localeCompare(b.name));
              this.cdr.detectChanges(); // Actualizar la vista tras cada detalle
            },
            error: (err) => {
              console.error(`Failed to fetch details for move: ${move.move.name}`, err);
            },
          });
        }
      });
    });
  }
}
