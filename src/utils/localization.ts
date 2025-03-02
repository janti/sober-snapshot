
export type Language = 'en' | 'fi';

interface Translations {
  [key: string]: {
    en: string;
    fi: string;
  };
}

export const translations: Translations = {
  // Header
  'app.title': {
    fi: 'Juomien seuranta',
    en: 'Drink Tracker'
  },
  'app.description': {
    fi: 'Seuraa juomasi ja nauti turvallisesti! Tämä sovellus näyttää sinulle, milloin voit ajaa.',
    en: 'Track your drinks and enjoy responsibly! This app shows you when it\'s safe to drive.'
  },
  // Current BAC
  'bac.current': {
    fi: 'Nykyinen veren alkoholipitoisuus',
    en: 'Current blood alcohol content'
  },
  'bac.status.sober': {
    fi: 'Selvä',
    en: 'Sober'
  },
  'bac.status.belowProfessional': {
    fi: 'Alle ammattikuljettajan rajan',
    en: 'Below professional limit'
  },
  'bac.status.belowRegular': {
    fi: 'Alle tavallisen rajan',
    en: 'Below regular limit'
  },
  'bac.status.aboveLimit': {
    fi: 'Yli laillisen rajan',
    en: 'Above legal limit'
  },
  'bac.refresh': {
    fi: 'Päivitä',
    en: 'Refresh'
  },
  // Chart
  'chart.title': {
    fi: 'Alkoholin muutos ajan myötä',
    en: 'Alcohol Over Time'
  },
  'chart.description': {
    fi: 'Veren alkoholipitoisuuden visualisointi',
    en: 'Blood alcohol content visualization'
  },
  'chart.regularLimit': {
    fi: 'Tavallinen raja',
    en: 'Regular limit'
  },
  'chart.professionalLimit': {
    fi: 'Ammattikuljettajan raja',
    en: 'Professional limit'
  },
  'chart.noData': {
    fi: 'Ei tietoja näytettäväksi. Lisää juomia nähdäksesi kaavion.',
    en: 'No data to display yet. Add some drinks to see your chart.'
  },
  'chart.moreData': {
    fi: 'Lisää datapisteitä nähdäksesi kaavion.',
    en: 'Add more data points to display the chart.'
  },
  // Time to sober
  'time.untilSober': {
    fi: 'Aika selviämiseen',
    en: 'Time Until Sober'
  },
  'time.soberAt': {
    fi: 'Arvioitu selviäminen klo',
    en: 'Estimated sober at'
  },
  'time.lessThanMinute': {
    fi: 'Alle minuutti',
    en: 'Less than a minute'
  },
  'time.hour': {
    fi: 'tunti',
    en: 'hour'
  },
  'time.hours': {
    fi: 'tuntia',
    en: 'hours'
  },
  'time.minute': {
    fi: 'minuutti',
    en: 'minute'
  },
  'time.minutes': {
    fi: 'minuuttia',
    en: 'minutes'
  },
  'time.youAreSober': {
    fi: 'Olet selvä nyt!',
    en: 'You are sober now!'
  },
  // Reset button
  'button.reset': {
    fi: 'Nollaa laskuri',
    en: 'Reset Calculator'
  },
  // Footer
  'footer.disclaimer1': {
    fi: 'Tämä laskuri on vain opetuskäyttöön eikä sitä tulisi käyttää ajokunnon määrittämiseen.',
    en: 'This calculator is for educational purposes only and should not be used to determine fitness to drive.'
  },
  'footer.disclaimer2': {
    fi: 'Juo aina vastuullisesti äläkä koskaan aja alkoholin vaikutuksen alaisena.',
    en: 'Always drink responsibly and never drive under the influence of alcohol.'
  },
  // Language
  'language.switch': {
    fi: 'Switch to English',
    en: 'Vaihda suomeksi'
  }
};

export const getTranslation = (key: string, language: Language): string => {
  const translationObj = translations[key];
  if (!translationObj) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translationObj[language];
};
