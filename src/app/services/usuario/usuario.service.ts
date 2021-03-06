import { Injectable } from '@angular/core';
import { Usuario } from '@models/usuario.model';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICES } from '@config/config';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { UploadFilesService } from '@services/upload-files/upload-files.service';

@Injectable()
export class UsuarioService {

  usuario: Usuario;
  token: string;
  menu: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    public _uploadFiles: UploadFilesService
  ) {
    this.loadFromLocalStorage();
   }

  /**
   * @description Devuelve true si el usuario esta logeado
   */
  islogin():  boolean { return this.token.length > 5; }

  /**
   * @description Cerrar sesión de usuario
   */
  logOut() {
    this.usuario = null;
    this.token = '';
    this.menu = [];
    localStorage.removeItem('menu');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  /**
   * @description Carga datos de la pagina que estan en el localStorage
   */
  loadFromLocalStorage() {
    if (localStorage.getItem('token')) {
      this.token = localStorage.getItem('token');
      this.usuario = JSON.parse(localStorage.getItem('usuario'));
      this.menu = JSON.parse(localStorage.getItem('menu'));
    }else {
      this.token = '';
      this.usuario = null;
      this.menu = [];
    }
  }

  /**
   * @description Guarda en el localStorage datos para inicio de sesión y validación
   * @param res {response} recive datos del usuario
   */
  saveDataUser(id: string, token: string, usuario: Usuario, menu: any) {
    localStorage.setItem('id', id);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('menu', JSON.stringify(menu));
    this.token = token;
    this.usuario = usuario;
    this.menu = menu;
  }

  /**
   * @description Inicia sesión con la API de Google
   * @param token
   */
  loginGoogle(token: string) {
    const url = `${URL_SERVICES}/login/google`;
    return this.http.post(url, {token})
                .map( (res: any) => {
                  this.saveDataUser(res.usuario._id, res.token, res.usuario, res.menu);
                  return true;
                });
}

  /**
   * @description Función para agregar un nuevo usuario a la DB mediante email
   * @param usuario {Usuario} modelo usuario de la DB
   */
  crearUser(usuario: Usuario) {
    const url = `${URL_SERVICES}/usuario`;
    return this.http.post(url, usuario)
            .map( (res: any) => {
              Swal('Usuario creado', `Con el correo: ${ usuario.email}`, 'success');
              return res.usuario;
            })
            .catch ( err => {
              Swal('Error al ingresar', 'Credenciales incorrectas', 'error' );
              return Observable.throw(err);
            });
  }

  /**
   * @description Sirve para enviar una petición al servirdor para logear un usuario
   * @param usuario {Usuario} modelo usuario de la DB
   * @param recordar {boolean} bandera para almecenar o barrar email del localStorage
   */
  login(usuario: Usuario, recordar: boolean) {
    if (recordar) {
      localStorage.setItem('email', usuario.email);
    }else {
      localStorage.removeItem('email');
    }
    const url = `${URL_SERVICES}/login`;
    return this.http.post(url, usuario)
          .map( (res: any) => {
            this.saveDataUser(res.usuario._id, res.token, res.usuario, this.menu);
            return true;
          })
          .catch ( err => {
            Swal('Error al ingresar', 'Credenciales incorrectas', 'error' );
            return Observable.throw(err);
          });
  }

  /**
   * @description Actualiza los datos de un usuario
   * @param usuario {Usuario} usuario a actualizar
   */
  updateDataUSer(usuario: Usuario) {
    const url = `${URL_SERVICES}/usuario/${usuario._id}?token=${this.token}`;
    return this.http.put(url, usuario)
              .map( (res: any) => {
                if (usuario._id === this.usuario._id) {
                  this.saveDataUser(res.usuario._id, this.token, res.usuario, this.menu);
                }
                Swal('Datos Actualizados', `Se actualizo el usuario: ${ usuario.nombre}`, 'success');
                return true;
              })
            .catch ( err => {
              Swal('Error al ingresar', 'Credenciales incorrectas', 'error' );
              return Observable.throw(err);
            });
  }

  /**
   * @description Actualizar la imagen del usuario
   * @param file {File} archivo a subir
   * @param id {string} id del usuario
   */
  changeImg( file: File, id: string) {
    this._uploadFiles.uploadFile(file, 'usuarios', id)
          .then( (res: any) => {
            Swal('Datos Actualizados', `Se actualizo exitosamente la imagen`, 'success');
            this.usuario.img = res.usuario.img;
            this.saveDataUser(id, this.token, this.usuario, this.menu);
          });
  }

  /**
   * @description Busca usuarios en un rango dado
   * @param range {number} El rango para buscar usuarios
   */
  loadUsers (range: number = 0) {
    const url = `${URL_SERVICES}/usuario?range=${range}`;
    return this.http.get(url);
  }

  /**
   * @description Busca un termino en la colección de usuarios
   * @param termino {string} El termino que se debe buscar
   */
  findColecction(termino: string) {
    const url = `${URL_SERVICES}/busqueda/coleccion/usuarios/${termino}`;
    return this.http.get(url).map( (res: any) => res.usuarios);
  }

  deleteUser(id: string) {
    const url = `${URL_SERVICES}/usuario/${id}?token=${this.token}`;

    return this.http.delete(url)
            .map( (res: any) => {
              Swal('Datos Actualizados', `El usuario ${ res.usuario.nombre} ha sido borrado`, 'success');
            });
  }
}
