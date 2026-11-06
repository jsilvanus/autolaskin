import { evaluateCells } from '@autolaskin/formula-engine';
export function createCurrentCarCells() {
    return {
        C1: { id: 'C1', label: 'Vuosittainen ajomäärä', unit: 'km/v', defaultValue: 15000 },
        C2: { id: 'C2', label: 'Polttoaineen kulutus', unit: 'l/100 km', defaultValue: 7.0 },
        C3: { id: 'C3', label: 'Polttoaineen litrahinta', unit: '€/l', defaultValue: 1.80 },
        C4: { id: 'C4', label: 'Ajoneuvovero', unit: '€/v', defaultValue: 300 },
        C5: { id: 'C5', label: 'Vakuutukset', unit: '€/v', defaultValue: 900 },
        C6: { id: 'C6', label: 'Huollot ja korjaukset', unit: '€/v', defaultValue: 600 },
        C7: { id: 'C7', label: 'Renkaat', unit: '€/v', defaultValue: 200 },
        C8: { id: 'C8', label: 'Arvioitu arvonalenema', unit: '€/v', defaultValue: 1500 },
        C9: { id: 'C9', label: 'Arvioitu vaihtohyvitys', unit: '€', defaultValue: 5000 },
        C10: { id: 'C10', label: 'Polttoaineen kulutus vuodessa', unit: 'l/v', formula: '=C1*C2/100' },
        C11: { id: 'C11', label: 'Polttoainekulut vuodessa', unit: '€/v', formula: '=C10*C3' },
        C12: { id: 'C12', label: 'Muut käyttökustannukset', unit: '€/v', formula: '=C4+C5+C6+C7' },
        C13: { id: 'C13', label: 'Kokonaiskustannukset vuodessa', unit: '€/v', formula: '=C11+C12+C8' },
        C14: { id: 'C14', label: 'Kustannukset kuukaudessa', unit: '€/kk', formula: '=C13/12' },
        C15: { id: 'C15', label: 'Kustannukset per km', unit: 'snt/km', formula: '=C13/C1*100' },
    };
}
export function createNewCarCells(_powertrain = 'ev') {
    // EV defaults (same for all powertrain types in this version)
    return {
        N1: { id: 'N1', label: 'Vuosittainen ajomäärä', unit: 'km/v', defaultValue: 15000 },
        N2: { id: 'N2', label: 'Sähkönkulutus', unit: 'kWh/100 km', defaultValue: 18.0 },
        N3: { id: 'N3', label: 'Kotilatauksen osuus', unit: '%', defaultValue: 80 },
        N4: { id: 'N4', label: 'Julkisen latauksen osuus', unit: '%', defaultValue: 20 },
        N5: { id: 'N5', label: 'Kotilatauksen hinta', unit: '€/kWh', defaultValue: 0.12 },
        N6: { id: 'N6', label: 'Julkisen latauksen hinta', unit: '€/kWh', defaultValue: 0.45 },
        N7: { id: 'N7', label: 'Lataushäviökerroin', unit: '%', defaultValue: 15 },
        N8: { id: 'N8', label: 'Ajoneuvovero', unit: '€/v', defaultValue: 100 },
        N9: { id: 'N9', label: 'Vakuutukset', unit: '€/v', defaultValue: 1000 },
        N10: { id: 'N10', label: 'Huollot ja korjaukset', unit: '€/v', defaultValue: 200 },
        N11: { id: 'N11', label: 'Renkaat', unit: '€/v', defaultValue: 200 },
        N12: { id: 'N12', label: 'Arvioitu arvonalenema', unit: '€/v', defaultValue: 2000 },
        N13: { id: 'N13', label: 'Energiankulutus vuodessa', unit: 'kWh/v', formula: '=N1*N2/100*(1+N7/100)' },
        N14: { id: 'N14', label: 'Kotilatauksen energiakulu', unit: '€/v', formula: '=N13*N3/100*N5' },
        N15: { id: 'N15', label: 'Julkisen latauksen energiakulu', unit: '€/v', formula: '=N13*N4/100*N6' },
        N16: { id: 'N16', label: 'Energiakulut yhteensä', unit: '€/v', formula: '=N14+N15' },
        N17: { id: 'N17', label: 'Muut käyttökustannukset', unit: '€/v', formula: '=N8+N9+N10+N11' },
        N18: { id: 'N18', label: 'Kokonaiskustannukset vuodessa', unit: '€/v', formula: '=N16+N17+N12' },
        N19: { id: 'N19', label: 'Kustannukset kuukaudessa', unit: '€/kk', formula: '=N18/12' },
        N20: { id: 'N20', label: 'Kustannukset per km', unit: 'snt/km', formula: '=N18/N1*100' },
    };
}
export function createSavingsCells() {
    return {
        S1: { id: 'S1', label: 'Energiakustannusten säästö', unit: '€/v', formula: '=C11-N16' },
        S2: { id: 'S2', label: 'Kokonaiskustannusten säästö', unit: '€/v', formula: '=C13-N18' },
        S3: { id: 'S3', label: 'Kuukausittainen energiasäästö', unit: '€/kk', formula: '=S1/12' },
        S4: { id: 'S4', label: 'Kuukausittainen kokonaissäästö', unit: '€/kk', formula: '=S2/12' },
    };
}
export function createFinancingCells() {
    return {
        F1: { id: 'F1', label: 'Takaisinmaksuaika', unit: 'v', defaultValue: 5 },
        F2: { id: 'F2', label: 'Vuosikorko', unit: '%', defaultValue: 5.0 },
        F3: { id: 'F3', label: 'Rahoituksen avauskulut', unit: '€', defaultValue: 0 },
        F4: { id: 'F4', label: 'Kuukausittaiset rahoituskulut', unit: '€/kk', defaultValue: 0 },
        F5: { id: 'F5', label: 'Säästöistä lyhennyksiin käytettävä osuus', unit: '%', defaultValue: 100 },
        F6: { id: 'F6', label: 'Nykyisen auton vaihtohyvitys', unit: '€', formula: '=C9' },
        F7: { id: 'F7', label: 'Käsiraha', unit: '€', defaultValue: 0 },
        F8: { id: 'F8', label: 'Toimituskulut ja muut hankinnan kulut', unit: '€', defaultValue: 500 },
        F9: { id: 'F9', label: 'Valittu kuukausisäästö', unit: '€/kk', formula: '=S4' },
        F10: { id: 'F10', label: 'Lyhennysvaraan käytettävä kuukausierä', unit: '€/kk', formula: '=F9*F5/100-F4' },
        F11: { id: 'F11', label: 'Maksuerien lukumäärä', formula: '=F1*12' },
        F12: { id: 'F12', label: 'Kuukausikorko', formula: '=F2/100/12' },
        // F13 and F14 are computed by computeAllCells using custom logic for annuity
        F13: { id: 'F13', label: 'Enimmäisrahoitus', unit: '€' },
        F14: { id: 'F14', label: 'Enimmäishankintahinta', unit: '€', formula: '=F13+F6+F7-F8' },
    };
}
export function computeAllCells(allCells) {
    // First pass: evaluate everything except F13/F14
    const withoutF13F14 = {};
    for (const [k, v] of Object.entries(allCells)) {
        if (k === 'F13' || k === 'F14')
            continue;
        withoutF13F14[k] = v;
    }
    const evaluated = evaluateCells(withoutF13F14);
    // Compute F13 using annuity formula
    const F10 = evaluated['F10']?.result ?? 0;
    const F11 = evaluated['F11']?.result ?? 0;
    const F12 = evaluated['F12']?.result ?? 0;
    let f13;
    if (F12 !== 0) {
        // P = M * (1 - (1+r)^(-n)) / r
        f13 = F10 * (1 - Math.pow(1 + F12, -F11)) / F12;
    }
    else {
        f13 = F10 * F11;
    }
    evaluated['F13'] = {
        ...(allCells['F13'] ?? { id: 'F13', label: 'Enimmäisrahoitus', unit: '€' }),
        defaultValue: f13,
        result: f13,
    };
    // Compute F14 = F13 + F6 + F7 - F8 directly using evaluated results
    if (allCells['F14']) {
        const F6 = evaluated['F6']?.result ?? 0;
        const F7 = evaluated['F7']?.result ?? 0;
        const F8 = evaluated['F8']?.result ?? 0;
        evaluated['F14'] = {
            ...allCells['F14'],
            result: f13 + F6 + F7 - F8,
        };
    }
    return evaluated;
}
//# sourceMappingURL=cells.js.map