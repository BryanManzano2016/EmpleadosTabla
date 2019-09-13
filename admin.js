//Elementos html como botones, checkbox y sections
var archivo = document.getElementById("fileCheck");
var consola = document.getElementById("consoleCheck");

var btnAgregar = document.getElementById("btnAgregar");
var btnRegresar = document.getElementById("btnRegresar");
var btnEnviar = document.getElementById("btnEnviar");
var btnEnviar2 = document.getElementById("btnEnviar2");

var seccionCrear = document.getElementById("sectionCrear");
var seccionLista = document.getElementById("sectionLista");
//Oculto seccion de modificar y crear
seccionCrear.hidden = true;
//Funcion que inicia el cliente
function WebSocketTest() 
{   
	if ("WebSocket" in window) 
   	{   		
   		//Abre la conexion con el servidor (ip:puerto)
		var ws = new WebSocket("ws://192.168.100.84:3001"); 
		/*Cuando presiono algun boton de modificar o eliminar se guarda 
			globalmente el id*/
		var iddSelect;

		var tablaP = document.getElementById("tabla");
		var cedulaF = document.getElementById("cedula");
		var nombreF = document.getElementById("nombre");
		var salarioF = document.getElementById("salario");
		//Inicio los elementos de manera predeterminada por cuestiones de diseño
		nombreF.value = "";
		cedulaF.value = "";
		salarioF.value = "";	

		archivo.checked = true;
		consola.checked = true;			
		//Cuando el cliente se abre envia una solicitud 
		ws.onopen = function () {
			ws.send("s_SELECT idd, cedula, nombre, salario FROM lista");		
		}
		//Escucha de mensajes de parte del servidor
		ws.onmessage = function (evt) { 
			//Limpia las filas de la tabla cada vez que llega un mensaje
			document.querySelectorAll(".filas").forEach(e => e.parentNode.removeChild(e));						
			//Recibir una cadena con formato json y la deserealizacion de inmediato
			var datos = evt.data;         
			var obj = JSON.parse(datos);
			//Leo el array de empleados del objeto json
			for (x in obj.empleados) {
				view(obj.empleados[x].idd, obj.empleados[x].cedula,
					obj.empleados[x].nombre, obj.empleados[x].salario);
			}  
		};   
		//Servidor se cierra
		ws.onclose = function () {
			alert("Closed server");
		}
		//Coloca fila por fila las consultas del servidor
		function view (msIdd, msCedula, msNombre, msSalario) 
		{	
			//Se crea una fila y le asignamos una clase .filas
			var fila = document.createElement("tr");
			fila.setAttribute("class", "filas");
			/*Se crean columnas y se añaden finalmente a la fila, esto con 
			los datos recibidos del servidor*/
			var idd = document.createElement("td");
			var nombreT = document.createTextNode(msIdd);
			idd.appendChild(nombreT);
			fila.appendChild(idd);			

			var cedula = document.createElement("td");
			var cedulaT = document.createTextNode(msCedula);
			cedula.appendChild(cedulaT);
			fila.appendChild(cedula);

			var nombre = document.createElement("td");
			var nombreT = document.createTextNode(msNombre);
			nombre.appendChild(nombreT);
			fila.appendChild(nombre);

			var salario = document.createElement("td");
			var salarioT = document.createTextNode(msSalario);
			salario.appendChild(salarioT);
			fila.appendChild(salario);
			//Un boton de ediar por cada fila creada
			var editar = document.createElement("td");
			var btnEditar = document.createElement("button");	
			btnEditar.setAttribute("type", "button");
			var btnEditarT = document.createTextNode("X");
			btnEditar.appendChild(btnEditarT);
			btnEditar.addEventListener("click", function(){
				//Asigno los valores a los elemetos input que vienen de la consulta
				cedulaF.value = msCedula;
				nombreF.value = msNombre;
				salarioF.value = msSalario;
				//Facilita poder usar el id en otras funciones
				iddSelect = msIdd;
				//Oculto botones y secciones de la pagina
				btnEnviar.hidden = true;
				btnEnviar2.hidden = false;						
				seccionLista.hidden = true;
				seccionCrear.hidden = false;
			}, false);			
			editar.appendChild(btnEditar);
			fila.appendChild(editar);

			var eliminar = document.createElement("td");
			var btnEliminar = document.createElement("button");	
			btnEliminar.setAttribute("type", "button");
			var btnEliminarT = document.createTextNode("X");
			btnEliminar.appendChild(btnEliminarT);
			eliminar.appendChild(btnEliminar);
			btnEliminar.addEventListener("click", function(){
				//Envia un sql para eliminar determinado usuario al servidor
				var sqlEliminar = "d_DELETE FROM lista WHERE idd =" + msIdd;
				ws.send(sqlEliminar);				

			}, false);
			fila.appendChild(eliminar);	
			tablaP.appendChild(fila);			
		}

		btnEnviar.addEventListener("click", crearUsuario, false);
		function crearUsuario () {
			//Si todos los campos no estan vacios ejecuta la solicitud
			if (cedulaF.value != "" && nombreF.value != "" && salarioF.value != "") 
			{

				var fecha = new Date();
				var fechaStr = fecha.getFullYear() + "-" + (fecha.getMonth() + 1) + "-" + 
				fecha.getDate();

				var sql = "i_INSERT INTO lista(cedula, nombre, salario, fecha_contrato) VALUES "  +
					"('" +  cedulaF.value + "', '" + 
					nombreF.value + "', " + 
					salarioF.value + ", '" +
					fechaStr + "')";

				ws.send(sql);

			}

			btnEnviar2.hidden = false;
			seccionLista.hidden = false;
			seccionCrear.hidden = true;			

			nombreF.value = "";
			cedulaF.value = "";
			salarioF.value = "";
		}

		btnEnviar2.addEventListener("click", actualizarUsuario, false);		
		function actualizarUsuario () 
		{
			if (cedulaF.value != "" && nombreF.value != "" && salarioF.value != "") 
			{			
				var sqlUpdate = "u_UPDATE lista SET cedula = '" + cedulaF.value + "', nombre = '" + 
				nombreF.value + "', salario = " + salarioF.value  + " WHERE idd = '" + iddSelect +"'";
				
				ws.send(sqlUpdate);
			}

			btnEnviar.hidden = false;
			seccionLista.hidden = false;
			seccionCrear.hidden = true;

			nombreF.value = "";
			cedulaF.value = "";
			salarioF.value = "";			
		}

		btnAgregar.addEventListener("click", function () {
			btnEnviar2.hidden = true;
			seccionLista.hidden = true;
			seccionCrear.hidden = false;
		}, false);

		btnRegresar.addEventListener("click", function () {
			seccionLista.hidden = false;
			seccionCrear.hidden = true;

			nombreF.value = "";
			cedulaF.value = "";
			salarioF.value = "";			
		}, false);	
		/*Mediante solicitud le dice al servidor que tenga determinado 
		comportamiento de registro de eventos*/
		archivo.onchange = function(){
	    	if(archivo.checked == true)
	    	{
	        	ws.send("a_bash");
	        }else if (archivo.checked == false) {
	        	ws.send("y_bash");	        	
	        }
	    }

		consola.onchange = function(){
	    	if(consola.checked == true)
	    	{
	        	ws.send("c_bash");
	        }else if (consola.checked == false) {
	        	ws.send("z_bash");
	        }	        
	    }			    

	} else {     
	  alert("WebSocket NOT supported by your Browser!");
	}
}

WebSocketTest();

