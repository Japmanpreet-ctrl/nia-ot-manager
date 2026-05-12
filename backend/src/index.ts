import app from './app';

app.listen(Number(process.env.PORT) || 4000, () => {
  console.log(`NIA OT Backend running on port ${process.env.PORT || 4000}`);
});
