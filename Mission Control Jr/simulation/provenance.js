export function validateSource(source) {
  return !!source && typeof source.id === 'string' && ['observation','reference','derived','authored'].includes(source.basisKind) && typeof source.title === 'string' && typeof source.limitation === 'string' && Array.isArray(source.usedBy) && (source.basisKind === 'authored' || /^https:\/\//.test(source.sourceUrl || ''));
}
