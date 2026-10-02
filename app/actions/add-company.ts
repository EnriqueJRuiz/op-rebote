"use server";

import { revalidatePath } from "next/cache";
import { APP_CONFIG, APP_ROUTES } from "@/domain/constants";
import { CompanySearchMatch, UniverseStock } from "@/domain/models/trading";
import { UNIVERSE_RULES } from "@/domain/rules/universe.rules";
import { createApplicationDependencies } from "@/infrastructure/composition";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-ES");
}

export async function searchCompanyToAddAction(query: string) {
  const searchTerm = query.trim();
  if (!searchTerm) return { status: "empty" as const };

  const dependencies = createApplicationDependencies();

  try {
    const companies = await dependencies.companiesRepository.getCompanies();
    const normalizedTerm = normalize(searchTerm);
    const existingCompanies = companies.filter((company) =>
      normalize(company.ticker) === normalizedTerm ||
      normalize(company.nombre).includes(normalizedTerm)
    );

    if (existingCompanies.length > 0) {
      return {
        status: "already_exists" as const,
        matches: existingCompanies.slice(0, 10).map((company) => ({
          ticker: company.ticker,
          nombre: company.nombre,
          bolsa: company.bolsa ?? "",
        })),
      };
    }

    const matches = await dependencies.marketRepository.searchCompanies(searchTerm);
    if (matches.length === 0) return { status: "not_found" as const };

    const exactMatches = matches.filter((match) =>
      normalize(match.ticker) === normalizedTerm ||
      normalize(match.nombre) === normalizedTerm
    );

    if (exactMatches.length === 1) {
      return addCompanyByTicker(exactMatches[0].ticker, dependencies);
    }

    return { status: "matches" as const, matches };
  } catch (error) {
    console.error("Error buscando una empresa para añadir al radar:", error);
    return { status: "error" as const };
  }
}

export async function addSelectedCompanyAction(ticker: string) {
  return addCompanyByTicker(ticker, createApplicationDependencies());
}

async function addCompanyByTicker(
  ticker: string,
  dependencies: ReturnType<typeof createApplicationDependencies>
) {
  const normalizedTicker = ticker.trim().toUpperCase();
  if (!normalizedTicker) return { status: "invalid" as const };

  try {
    const companies = await dependencies.companiesRepository.getCompanies();
    const existing = companies.find(
      (company) => company.ticker.trim().toUpperCase() === normalizedTicker
    );
    if (existing) {
      return {
        status: "already_exists" as const,
        matches: [{ ticker: existing.ticker, nombre: existing.nombre, bolsa: existing.bolsa ?? "" }],
      };
    }

    const { stock, metadata } = await dependencies.marketRepository.getCompanySnapshot(
      normalizedTicker,
      true
    );
    if (
      !metadata ||
      metadata.tipoActivo.toUpperCase() !== "EQUITY" ||
      !Number.isFinite(stock.precio) ||
      stock.precio <= 0
    ) {
      return { status: "invalid" as const };
    }

    const marketCap = Number.isFinite(stock.capitalizacion) && stock.capitalizacion! > 0
      ? stock.capitalizacion!
      : 0;
    const categoria = marketCap >= UNIVERSE_RULES.TOP.MIN_MARKET_CAP
      ? APP_CONFIG.CATEGORIES.TOP
      : APP_CONFIG.CATEGORIES.MID;

    const companyToSave: UniverseStock = {
      ticker: stock.ticker,
      nombre: stock.nombre,
      precio: stock.precio,
      volumen: stock.volumen,
      marketCap,
      pais: metadata.pais,
      sector: metadata.sector,
      industria: metadata.industria,
      exchange: metadata.bolsa,
      tipoActivo: metadata.tipoActivo,
      quoteType: metadata.tipoActivo,
      moneda: metadata.moneda,
      categoria,
    };

    await dependencies.companiesRepository.saveNewCompanies([companyToSave], categoria);
    await dependencies.companiesRepository.updateCompanyMetadataByTicker(
      stock.ticker,
      stock.nombre,
      metadata
    );

    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);
    return { status: "added" as const, ticker: stock.ticker, nombre: stock.nombre };
  } catch (error) {
    console.error(`Error añadiendo ${normalizedTicker} al radar:`, error);
    return { status: "error" as const };
  }
}

export type AddCompanySearchMatch = CompanySearchMatch;