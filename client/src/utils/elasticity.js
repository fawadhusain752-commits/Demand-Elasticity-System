export function computeElasticity(obs1, obs2) {
  if (!obs1 || !obs2) {
    return { error: 'Please choose both Observation 1 and Observation 2.' };
  }
  if (obs1.observation_id === obs2.observation_id) {
    return { error: 'Please select two different observations to compare.' };
  }

  const P1 = parseFloat(obs1.price);
  const Q1 = parseInt(obs1.quantity_sold, 10);
  const P2 = parseFloat(obs2.price);
  const Q2 = parseInt(obs2.quantity_sold, 10);

  if (P1 === P2) {
    return { error: 'Both observations have identical prices ($' + P1 + '). Midpoint price elasticity is undefined due to division by zero.' };
  }
  if (Q1 + Q2 === 0) {
    return { error: 'Total quantity sold is zero in both observations.' };
  }

  const deltaQ = Q2 - Q1;
  const avgQ = (Q1 + Q2) / 2;
  const pctQ = (deltaQ / avgQ) * 100;

  const deltaP = P2 - P1;
  const avgP = (P1 + P2) / 2;
  const pctP = (deltaP / avgP) * 100;

  const rawEd = (deltaQ / avgQ) / (deltaP / avgP);
  const ed = Math.abs(rawEd);
  const roundedEd = parseFloat(ed.toFixed(3));

  let classification = '';
  let badgeColor = '';
  let explanation = '';

  if (roundedEd > 1.0) {
    classification = 'Elastic Demand';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    explanation = `The percentage quantity response (${Math.abs(pctQ).toFixed(1)}%) is larger than the percentage price shift (${Math.abs(pctP).toFixed(1)}%). Price adjustments will strongly influence customer volume.`;
  } else if (roundedEd < 1.0) {
    classification = 'Inelastic Demand';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    explanation = `The percentage quantity response (${Math.abs(pctQ).toFixed(1)}%) is smaller than the price change (${Math.abs(pctP).toFixed(1)}%). Customers are relatively insensitive to this price interval.`;
  } else {
    classification = 'Unit Elastic Demand';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    explanation = 'The percentage change in quantity demanded exactly offsets the percentage change in price. Total revenue remains neutral.';
  }

  return {
    p1: P1,
    q1: Q1,
    p2: P2,
    q2: Q2,
    pctP: parseFloat(pctP.toFixed(2)),
    pctQ: parseFloat(pctQ.toFixed(2)),
    ed: roundedEd,
    classification,
    badgeColor,
    explanation,
  };
}