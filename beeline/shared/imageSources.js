export function companyLogo(i) {
  if (!i)
    return '';
  return `${process.env.BACKEND_URL}/companies/${i}/logo`;
}
