export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      azienda: {
        Row: {
          aggiornato_il: string | null
          creato_il: string | null
          email: string
          font_size_client: number | null
          font_size_custom_quote: number | null
          font_size_list: number | null
          font_size_quote: number | null
          font_size_settings: number | null
          id: string
          logo_url: string | null
          partita_iva: string
          ragione_sociale: string
          sede_legale: string
          telefono: string
        }
        Insert: {
          aggiornato_il?: string | null
          creato_il?: string | null
          email: string
          font_size_client?: number | null
          font_size_custom_quote?: number | null
          font_size_list?: number | null
          font_size_quote?: number | null
          font_size_settings?: number | null
          id?: string
          logo_url?: string | null
          partita_iva: string
          ragione_sociale: string
          sede_legale: string
          telefono: string
        }
        Update: {
          aggiornato_il?: string | null
          creato_il?: string | null
          email?: string
          font_size_client?: number | null
          font_size_custom_quote?: number | null
          font_size_list?: number | null
          font_size_quote?: number | null
          font_size_settings?: number | null
          id?: string
          logo_url?: string | null
          partita_iva?: string
          ragione_sociale?: string
          sede_legale?: string
          telefono?: string
        }
        Relationships: []
      }
      clienti: {
        Row: {
          aggiornato_il: string | null
          cap: string | null
          citta: string | null
          codice_fiscale_piva: string | null
          creato_il: string | null
          email: string | null
          id: string
          nome_ragione_sociale: string
          provincia: string | null
          telefono: string | null
          via: string | null
        }
        Insert: {
          aggiornato_il?: string | null
          cap?: string | null
          citta?: string | null
          codice_fiscale_piva?: string | null
          creato_il?: string | null
          email?: string | null
          id?: string
          nome_ragione_sociale: string
          provincia?: string | null
          telefono?: string | null
          via?: string | null
        }
        Update: {
          aggiornato_il?: string | null
          cap?: string | null
          citta?: string | null
          codice_fiscale_piva?: string | null
          creato_il?: string | null
          email?: string | null
          id?: string
          nome_ragione_sociale?: string
          provincia?: string | null
          telefono?: string | null
          via?: string | null
        }
        Relationships: []
      }
      preventivi: {
        Row: {
          aggiornato_il: string | null
          anno: number
          cliente_id: string | null
          creato_il: string | null
          id: string
          modalita_pagamento: string | null
          note: string | null
          numero: number
          oggetto: string | null
          sconto_percentuale: number | null
          sconto_valore: number | null
          stato: string | null
          subtotale: number | null
          totale: number | null
          ubicazione_cap: string | null
          ubicazione_citta: string | null
          ubicazione_provincia: string | null
          ubicazione_via: string | null
        }
        Insert: {
          aggiornato_il?: string | null
          anno: number
          cliente_id?: string | null
          creato_il?: string | null
          id?: string
          modalita_pagamento?: string | null
          note?: string | null
          numero: number
          oggetto?: string | null
          sconto_percentuale?: number | null
          sconto_valore?: number | null
          stato?: string | null
          subtotale?: number | null
          totale?: number | null
          ubicazione_cap?: string | null
          ubicazione_citta?: string | null
          ubicazione_provincia?: string | null
          ubicazione_via?: string | null
        }
        Update: {
          aggiornato_il?: string | null
          anno?: number
          cliente_id?: string | null
          creato_il?: string | null
          id?: string
          modalita_pagamento?: string | null
          note?: string | null
          numero?: number
          oggetto?: string | null
          sconto_percentuale?: number | null
          sconto_valore?: number | null
          stato?: string | null
          subtotale?: number | null
          totale?: number | null
          ubicazione_cap?: string | null
          ubicazione_citta?: string | null
          ubicazione_provincia?: string | null
          ubicazione_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preventivi_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      righe_preventivo: {
        Row: {
          creato_il: string | null
          descrizione: string
          id: string
          numero_riga: number
          preventivo_id: string
          prezzo_unitario: number
          quantita: number
          totale: number
          unita_misura: string
        }
        Insert: {
          creato_il?: string | null
          descrizione: string
          id?: string
          numero_riga: number
          preventivo_id: string
          prezzo_unitario?: number
          quantita?: number
          totale?: number
          unita_misura: string
        }
        Update: {
          creato_il?: string | null
          descrizione?: string
          id?: string
          numero_riga?: number
          preventivo_id?: string
          prezzo_unitario?: number
          quantita?: number
          totale?: number
          unita_misura?: string
        }
        Relationships: [
          {
            foreignKeyName: "righe_preventivo_preventivo_id_fkey"
            columns: ["preventivo_id"]
            isOneToOne: false
            referencedRelation: "preventivi"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
