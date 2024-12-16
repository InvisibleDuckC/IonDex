import { HttpClient } from '@angular/common/http';
import { Pokemon, LevelUpMove, TypeDetails } from '../models/pokemon.model';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PokeApiService {
  private baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  getPokemonList(offset: number = 0, limit: number = 20): Observable<{ results: Pokemon[] }> {
    return this.http.get<{ results: Pokemon[] }>(`${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`);
  }

  getPokemonDetails(idOrName: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pokemon/${idOrName}`);
  }

  getPokemonSpecies(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pokemon-species/${id}`);
  }

  getEvolutionChain(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/evolution-chain/${id}`);
  }

  getMoveDetails(moveName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/move/${moveName}`);
  }
  
  getTypeDetails(typeName: string): Observable<TypeDetails> {
    return this.http.get<TypeDetails>(`${this.baseUrl}/type/${typeName}`).pipe(
      catchError((err) => {
        console.error(`[Service] Error fetching type details for ${typeName}:`, err);
        return throwError(() => err);
      })
    );
  }
  

  // Método para obtener los detalles de una habilidad
  getAbilityDetails(abilityName: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ability/${abilityName}`);
  }

}
