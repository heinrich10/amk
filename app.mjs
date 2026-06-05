/* no-console: "off" */
import { app } from './src/api.mjs';

app.listen(3000, function(){
	console.log('running');
});
