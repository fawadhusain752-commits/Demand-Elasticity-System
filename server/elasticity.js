/**
 * Calculates Midpoint Price Elasticity of Demand (Ed):
 * Ed = | [ (Q2 - Q1) / ((Q1 + Q2) / 2) ] / [ (P2 - P1) / ((P1 + P2) / 2) ] |
 */
function calculateElasticity(p1, q1, p2, q2) {
  const P1 = parseFloat(p1);
  const P2 = parseFloat(p2);
  const Q1 = parseInt(q1, 10);
  const Q2 = parseInt(q2, 10);

  // 1. Input validations
  if (isNaN(P1) || isNaN(P2) || isNaN(Q1) || isNaN(Q2)) {
    return { error: 'Price and quantity values must be valid numbers.' };
  }
  if (P1 <= 0 || P2 <= 0) {
    return { error: 'Prices must be greater than zero.' };
  }
  if (Q1 < 0 || Q2 < 0) {
    return { error: 'Quantities sold cannot be negative.' };
  }
  if (P1 === P2) {
    return { error: 'Cannot calculate elasticity when prices are identical (division by zero in price change).' };
  }
  if (Q1 + Q2 === 0) {
    return { error: 'Total quantity demanded across both observations is zero.' };
  }

  // 2. Midpoint differences and averages
  const deltaQ = Q2 - Q1;
  const avgQ = (Q1 + Q2) / 2;
  const pctChangeQ = (deltaQ / avgQ) * 100;

  const deltaP = P2 - P1;
  const avgP = (P1 + P2) / 2;
  const pctChangeP = (deltaP / avgP) * 100;

  // 3. Elasticity value (Absolute value)
  const rawEd = (deltaQ / avgQ) / (deltaP / avgP);
  const ed = Math.abs(rawEd);
  const roundedEd = parseFloat(ed.toFixed(3));

  // 4. Classification
  let classification = '';
  let explanation = '';

  if (roundedEd > 1.0) {
    classification = 'Elastic Demand';
    explanation = 'The percentage change in quantity demanded is greater than the percentage change in price. Consumers are sensitive to price variations.';
  } else if (roundedEd < 1.0) {
    classification = 'Inelastic Demand';
    explanation = 'The percentage change in quantity demanded is smaller than the percentage change in price. Consumers are relatively insensitive to price variations.';
  } else {
    classification = 'Unit Elastic Demand';
    explanation = 'The percentage change in quantity demanded equals the percentage change in price. Total revenue remains unchanged across this interval.';
  }

  return {
    p1: P1,
    q1: Q1,
    p2: P2,
    q2: Q2,
    pctChangePrice: parseFloat(pctChangeP.toFixed(2)),
    pctChangeQuantity: parseFloat(pctChangeQ.toFixed(2)),
    elasticity: roundedEd,
    rawElasticity: rawEd,
    classification,
    explanation,
  };
}

module.exports = { calculateElasticity };