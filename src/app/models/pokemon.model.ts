export interface Pokemon {
    id: string;
    name: string;
    url: string;
    image?: string;
  }
  
  export interface LevelUpMove {
    name: string;
    level: number;
  }
  
  export interface DamageRelations {
    double_damage_to: { name: string }[];
    half_damage_to: { name: string }[];
    no_damage_to: { name: string }[];
    double_damage_from: { name: string }[];
    half_damage_from: { name: string }[];
    no_damage_from: { name: string }[];
  }
  
  export interface TypeDetails {
    name: string; // Añadir esta línea
    damage_relations: {
      double_damage_from: { name: string }[];
      double_damage_to: { name: string }[];
      half_damage_from: { name: string }[];
      half_damage_to: { name: string }[];
      no_damage_from: { name: string }[];
      no_damage_to: { name: string }[];
    };
  }
  
  