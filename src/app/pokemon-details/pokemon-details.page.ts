import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokeApiService } from '../services/poke-api.service';
import { TypeDetails } from '../models/pokemon.model';


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
    sprite: string;
    isBranch?: boolean;
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

  typeRelations: { title: string; types: string[] }[] = [
    { title: 'Strengths', types: [] },
    { title: 'Weaknesses', types: [] },
    { title: 'Resistances', types: [] },
    { title: 'Inefficiencies', types: [] },
  ];
  

  offensiveEffectiveness: { type: string; strengths: string[]; weaknesses: string[]; ineffectives: string[] }[] = [];
  defensiveWeaknesses: { type: string; multiplier: string }[] = [];
  defensiveResistances: { type: string; multiplier: string }[] = [];
  defensiveImmunities: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private pokeApiService: PokeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPokemonDetails(id);
      this.loadPokemonSpecies(id);
    } else {
      console.error('No ID found in route');
    }
  }

  get moveCategories(): string[] {
    return Object.keys(this.categorizedMoves);
  }

  // Cargar detalles del Pokémon
  loadPokemonDetails(id: string) {
    this.pokeApiService.getPokemonDetails(id).subscribe({
      next: (details) => {
        this.pokemonDetails = details;
        this.loadTypeRelations(details.types || []);
        this.processAbilities(details.abilities || []);
        this.categorizeMoves(details.moves || []);
  
        // Llama a loadEffectivenessIndicators con los tipos del Pokémon
        if (details.types && details.types.length > 0) {
          this.loadEffectivenessIndicators(details.types);
        }
  
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching Pokemon details:', err),
    });
  }
  

  // Cargar datos de la especie del Pokémon
  loadPokemonSpecies(id: string) {
    this.pokeApiService.getPokemonSpecies(id).subscribe({
      next: (species) => {
        if (!species) return;
        this.description = species.flavor_text_entries?.find(
          (entry: any) => entry.language.name === 'en'
        )?.flavor_text.replace(/\n|\f/g, ' ') || 'No description available.';
        this.habitat = species.habitat?.name || 'Unknown';
        this.shape = species.shape?.name || 'Unknown';

        if (species.evolution_chain?.url) {
          const evolutionChainId = Number(species.evolution_chain.url.split('/').slice(-2)[0]);
          this.loadEvolutionChain(evolutionChainId);
        }

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching species data:', err),
    });
  }

  // Procesar relaciones de tipos
  loadTypeRelations(types: any[]) {
    const typeNames = types.map((type: any) => type.type.name);

    typeNames.forEach((typeName: string) => {
      this.pokeApiService.getTypeDetails(typeName).subscribe({
        next: (typeDetails: any) => {
          if (typeDetails.damage_relations) {
            this.updateTypeRelations(typeDetails.damage_relations);
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(`Error fetching type details for ${typeName}:`, err),
      });
    });
  }

  updateTypeRelations(relations: any) {
    this.addUniqueTypes(relations.double_damage_from, this.weaknesses);
    this.addUniqueTypes(relations.double_damage_to, this.strengths);
    this.addUniqueTypes(relations.half_damage_from, this.resistances);
    this.addUniqueTypes(relations.no_damage_from, this.inefficiencies);

    this.typeRelations = [
      { title: 'Strengths', types: this.strengths },
      { title: 'Weaknesses', types: this.weaknesses },
      { title: 'Resistances', types: this.resistances },
      { title: 'Inefficiencies', types: this.inefficiencies },
    ];
  }

  addUniqueTypes(types: any[], targetArray: string[]) {
    types.forEach((type: any) => {
      if (!targetArray.includes(type.name)) targetArray.push(type.name);
    });
  }

  // Manejo de error en imágenes
  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/default-icon.png';
  }

  // Procesar habilidades
  processAbilities(abilities: any[]) {
    abilities.forEach((ability: any) => {
      if (ability.ability?.name) {
        this.pokeApiService.getAbilityDetails(ability.ability.name).subscribe({
          next: (abilityInfo) => {
            const effectEntry = abilityInfo.effect_entries.find(
              (e: any) => e.language.name === 'en'
            );
            this.abilityDetails.push({
              name: abilityInfo.name,
              effect: effectEntry?.effect || 'No effect available.',
            });
            this.cdr.detectChanges();
          },
          error: (err) =>
            console.error(`Failed to fetch details for ability: ${ability.ability.name}`, err),
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
          this.cdr.detectChanges();
        } else {
          console.warn('No evolution chain data available');
        }
      },
      error: (err) => console.error('Error fetching evolution chain:', err),
    });
  }

  loadEffectivenessIndicators(types: any[]): void {
    const offensiveByType: { [key: string]: { strengths: string[]; weaknesses: string[]; ineffectives: string[] } } = {};
    const combinedDefensiveEffectiveness: { [key: string]: number } = {};

    const typeNames = types.map((type: any) => type.type.name);

    typeNames.forEach((typeName) => {
      this.pokeApiService.getTypeDetails(typeName).subscribe({
          next: (typeDetails: any) => {
              if (!typeDetails.damage_relations) return;
  
              // Asignar efectividades ofensivas
              offensiveByType[typeName] = {
                  strengths: typeDetails.damage_relations.double_damage_to.map((type: any) => type.name),
                  weaknesses: typeDetails.damage_relations.half_damage_to.map((type: any) => type.name),
                  ineffectives: typeDetails.damage_relations.no_damage_to.map((type: any) => type.name),
              };
  
              // Procesar inmunidades
              typeDetails.damage_relations.no_damage_from.forEach((type: any) => {
                  combinedDefensiveEffectiveness[type.name] = 0; // Siempre priorizar inmunidades
              });
  
              // Procesar debilidades
              typeDetails.damage_relations.double_damage_from.forEach((type: any) => {
                  if (combinedDefensiveEffectiveness[type.name] !== 0) {
                      combinedDefensiveEffectiveness[type.name] =
                          (combinedDefensiveEffectiveness[type.name] || 1) * 2;
                  }
              });
  
              // Procesar resistencias
              typeDetails.damage_relations.half_damage_from.forEach((type: any) => {
                  if (combinedDefensiveEffectiveness[type.name] !== 0) {
                      combinedDefensiveEffectiveness[type.name] =
                          (combinedDefensiveEffectiveness[type.name] || 1) * 0.5;
                  }
              });
  
              this.displayEffectivenessResults(offensiveByType, combinedDefensiveEffectiveness);
          },
          error: (err) => console.error(`Error fetching type details for ${typeName}:`, err),
      });
    });
  }
  
  displayEffectivenessResults(
    offensiveByType: { [key: string]: { strengths: string[]; weaknesses: string[]; ineffectives: string[] } },
    combinedDefensiveEffectiveness: { [key: string]: number }
  ): void {
    this.offensiveEffectiveness = Object.entries(offensiveByType).map(([type, effectiveness]) => ({
      type,
      strengths: effectiveness.strengths,
      weaknesses: effectiveness.weaknesses,
      ineffectives: effectiveness.ineffectives,
    }));
  
    this.defensiveWeaknesses = [];
    this.defensiveResistances = [];
    this.defensiveImmunities = [];
  
    Object.entries(combinedDefensiveEffectiveness).forEach(([type, multiplier]) => {
      if (multiplier === 0) {
        // Si es inmunidad, tiene prioridad
        this.defensiveImmunities.push(type);
      } else if (multiplier >= 4) {
        this.defensiveWeaknesses.push({ type, multiplier: 'x4' });
      } else if (multiplier === 2) {
        this.defensiveWeaknesses.push({ type, multiplier: 'x2' });
      } else if (multiplier <= 0.25) {
        this.defensiveResistances.push({ type, multiplier: '1/4' });
      } else if (multiplier === 0.5) {
        this.defensiveResistances.push({ type, multiplier: '1/2' });
      }
    });

    this.adjustEffectivenessLists();
  }
  
  adjustEffectivenessLists(): void {
    // Eliminamos debilidades y resistencias que coincidan con inmunidades
    this.defensiveImmunities.forEach((immuneType) => {
      this.defensiveWeaknesses = this.defensiveWeaknesses.filter((weakness) => weakness.type !== immuneType);
      this.defensiveResistances = this.defensiveResistances.filter((resistance) => resistance.type !== immuneType);
    });
  
    // Neutralidades: eliminamos tipos presentes en ambas listas (debilidades y resistencias)
    const neutralTypes = this.defensiveWeaknesses.filter((weakness) =>
      this.defensiveResistances.some((resistance) => resistance.type === weakness.type)
    );
  
    neutralTypes.forEach((neutral) => {
      this.defensiveWeaknesses = this.defensiveWeaknesses.filter((weakness) => weakness.type !== neutral.type);
      this.defensiveResistances = this.defensiveResistances.filter((resistance) => resistance.type !== neutral.type);
    });
  }
  

  // Procesar cadena evolutiva
  processEvolutionChain(chain: any): any[] {
    const evolution: any[] = [];
    if (!chain || typeof chain !== 'object') return evolution;

    const conditions = this.extractEvolutionConditions(chain.evolution_details || []);
    const id = chain.species?.url?.split('/').slice(-2)[0];
    if (id) {
      evolution.push({
        name: chain.species.name,
        id,
        conditions,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      });
    }

    if (Array.isArray(chain.evolves_to)) {
      chain.evolves_to.forEach((nextChain: any) => {
        evolution.push(...this.processEvolutionChain(nextChain));
      });
    }

    return evolution;
  }

  extractEvolutionConditions(details: any[]): string[] {
    const conditions: string[] = [];
    details.forEach((detail) => {
      if (detail.min_level) conditions.push(`Evolves at level ${detail.min_level}`);
      if (detail.item) conditions.push(`Requires item: ${detail.item.name}`);
      if (detail.trigger) conditions.push(`Trigger: ${detail.trigger.name}`);
      if (detail.min_happiness) conditions.push(`Requires happiness: ${detail.min_happiness}`);
      if (detail.gender === 1) conditions.push('Female only');
      if (detail.gender === 2) conditions.push('Male only');
    });
    return conditions;
  }

  // Categorizar movimientos
  categorizeMoves(moves: any[]): void {
    // Inicializa un conjunto para cada categoría para evitar duplicados
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
  
        // Asegúrate de inicializar el conjunto de movimientos si no existe
        if (!seenMoves[method]) {
          seenMoves[method] = new Set();
        }
  
        // Asegúrate de inicializar la categoría en categorizedMoves si no existe
        if (!this.categorizedMoves[method]) {
          this.categorizedMoves[method] = [];
        }
  
        // Evita duplicados verificando si el movimiento ya está en el conjunto
        if (!seenMoves[method].has(move.move.name)) {
          seenMoves[method].add(move.move.name); // Agrega al conjunto para evitar duplicados
  
          this.pokeApiService.getMoveDetails(move.move.name).subscribe({
            next: (moveDetails) => {
              const damageClass = moveDetails.damage_class?.name || 'unknown';
              const damageClassIcon = `assets/attack-icons/${damageClass}.gif`;
  
              // Agrega el movimiento a la categoría correspondiente
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
  
              // Ordena los movimientos por nombre
              this.categorizedMoves[method].sort((a, b) => a.name.localeCompare(b.name));
  
              // Actualiza la vista
              this.cdr.detectChanges();
            },
            error: (err) => console.error(`Failed to fetch details for move: ${move.move.name}`, err),
          });
        }
      });
    });
  }
  
  
}
