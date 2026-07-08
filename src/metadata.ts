export interface MetadataEntry {
  label: string;
  value: string;
}

export function parse(input: string): MetadataEntry[] {
  return input
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const separatorIndex = line.indexOf(':');
      const label = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : '';
      if (label === '') {
        throw Error(`Invalid metadata line. Expected "key: value" format. line=${line}`);
      }
      return { label, value: line.slice(separatorIndex + 1).trim() };
    });
}
