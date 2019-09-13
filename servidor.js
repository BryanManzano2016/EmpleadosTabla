//Referenciar a la libreria ws y abro el servidor
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });
//Cada vez que hay una conexion se ejecuta la funcion interna
wss.on('connection', function connection(ws, req) {
	//Predeterminadamente se registran eventos en archivo y consola
	var modoConsole = true;
	var modoFile = true; 
	//Referenciar a la libreria mysql y abro conexion
	const mysql = require('mysql');
	var con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: "",
		database: "empleados"
	});
	////Referenciar a la libreria fs
	var fs = require('fs');
	//Cadena json que despues de cada solicitud vuelve al primer estado
	var jsonT = '{"empleados":[';
	//Ip de cliente
	const ip = req.connection.remoteAddress;

	function info () 
	{
		var fecha = new Date();		
		var informacionInicio;
		//Si existe conexion se generan eventos para almacenar
		if (ws.readyState == WebSocket.OPEN || ws.readyState == WebSocket.CONNECTING) {
			informacionInicio = "Cliente abierto.- Ip: " + ip + ", hora: " + fecha;	
		}else {
			informacionInicio = "Cliente cerrado.- Ip: " + ip + ", hora: " + fecha;
		}	
		//Escribe en consola
		console.log(informacionInicio);
		//Añade texto a un archivo (si no existe se crea)
		fs.appendFile('log.txt', informacionInicio + "\n\n", function (err) {
		  //En caso de fallo se lanza un error
		  if (err) throw err;
		}); 		
	}	
	/*Funcion reutilizable para registros que solo requiere de
		un argumento para evidenciar lo que hace un cliente*/
	function accionLog (text) {
		var fecha = new Date();		
		var informacionAccion = "Ip: " + ip + ", hora: " + fecha + ", accion: " + text;

		if (modoConsole == true) {
			console.log(informacionAccion);
		}
		if (modoFile == true) {
			fs.appendFile('log.txt', informacionAccion + "\n\n", function (err) {
			  if (err) throw err;
			}); 			
		}
	}

	info();
	//Cada vez que el servidor recibe un mensaje
  	ws.on('message', function incoming(message) {
		//Funcion que ejecuta una consulta mysql que se otorga como argumente
		function consulta (sqlConsulta) {
			//result da la consulta requerida
			con.query(sqlConsulta, function (err, result, fields) {
				
				if (err) throw err;
				//Leo las filas hasta que existan datos validos
				for (var i = 0; result[i] != undefined ; i++) 
				{
					//Cadena json para ser enviada tal cual 
					var fecha = result[i].fecha_contrato;	    	
					jsonT += '{"idd":"' + result[i].idd + '",' +
						'"cedula":"' + result[i].cedula + '",' + 
						'"nombre":"' + result[i].nombre + '",' +
						'"salario":"' + result[i].salario + '"}';
					//Si no hay mas resultados de filas no se añade la coma
					if ( result[i + 1] != undefined ) 
					{
						jsonT += ',';
					}else {
						jsonT += ']}';	
					}
				}	
				//A cada cliente activo se envia la consulta mediante el argumento cliente
			    wss.clients.forEach(function each(client) {
			      if (client.readyState === WebSocket.OPEN) {
			        client.send(jsonT);
			      }
			    });				
			});	
			jsonT = '{"empleados":[';
		}	  		
		/*Cuando llega un mensaje se separa el sql y la instruccion con formato
			instruccion_comandoSQL */
		var mensaje = message;
		var comando = mensaje.substring(0, 1);
		var sql = mensaje.substring(2, mensaje.length);
		//Cada evento sql genera una select que sera enviado a cada cliente
		switch (comando) 
		{
			case "s":
				//comando select
				consulta (sql);
				break;	

			case "i":
				//comando insert
				con.query(sql, function (err, result) {
					if (err) throw err;
					accionLog(sql);
				});
				consulta("SELECT idd, cedula, nombre, salario FROM lista");		    				    			
				break;

			case "d":
				//comando delect
				con.query(sql, function (err, result) {
					if (err) throw err;
					accionLog(sql);
				});
			    consulta ("SELECT idd, cedula, nombre, salario FROM lista");
				break;

			case "u":
				//comando update
				con.query(sql, function (err, result) {
					if (err) throw err;
					accionLog(sql);
				});
				consulta ("SELECT idd, cedula, nombre, salario FROM lista");
				break;

			case "c":
				//instruccion para eventos en consola
				modoConsole = true;
				accionLog("modo consola");
				break;
			case "z":
				modoConsole = false;
				accionLog("modo consola desactivado");				
				break;

			case "a":
				//instruccion para eventos en archivo			
				modoFile = true;
				accionLog("modo archivo");
				break;

			case "y":
				modoFile = false;
				accionLog("modo archivo desactivado");					
				break;

			default:				
				break;
		}
  	}); 
  	//Si un cliente se cierra se genera un registro
  	ws.on("close", function () {
  		info();
  	});
});
