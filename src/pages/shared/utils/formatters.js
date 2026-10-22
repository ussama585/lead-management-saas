

export const formatCurrency = (str) => {
  const match = str.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}


export const formatSalaryNum = (salary) => {
  const num = Number(salary);
  
  if (isNaN(num)) {
    return salary; // or return '' if you want to hide invalid values
  }

  return num.toLocaleString();
}



export const formatCount = (count) => {
  const num = Number(count);
  if (isNaN(num)) return count;
  return num.toLocaleString();
};


export const formatPaymentTerm = (paymentTerm) => {
  
  const terms = {
    'Per Hour' : '/hr',
    'Per Month' : '/mo',
    'Per Year' : '/yr'
  }
  
 
  return terms[paymentTerm];

}

