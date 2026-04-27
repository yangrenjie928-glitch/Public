const countries = [
  { code: "RU", dial: "+7", label: "Россия" },
  { code: "KZ", dial: "+7", label: "Казахстан" },
  { code: "BY", dial: "+375", label: "Беларусь" },
];

function PhoneInput({ countryCode, onCountryChange, phone, onPhoneChange, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-600">📱 Номер телефона</label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(event) => onCountryChange(event.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-fuchsia-500"
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label} ({country.dial})
            </option>
          ))}
        </select>
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="+7 XXX XXX XX XX"
          inputMode="tel"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-bold outline-none transition focus:border-fuchsia-500"
        />
      </div>
      {error ? <p className="text-sm font-black text-rose-600">{error}</p> : null}
    </div>
  );
}

export default PhoneInput;
