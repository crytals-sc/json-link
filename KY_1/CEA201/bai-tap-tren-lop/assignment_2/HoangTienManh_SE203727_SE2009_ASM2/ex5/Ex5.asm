.386
option casemap:none

include \masm32\include\masm32rt.inc

.data
    msg1 db "Enter v1 (0-9): ", 0
    msg2 db "Enter v2 (0-9): ", 0
    msg3 db "v2 = 0, cannot divide.", 0
    msg4 db "v1+v2 = ", 0
    msg5 db "v1-v2 = ", 0
    msg6 db "v1*v2 = ", 0
    msg7 db "v1/v2 = ", 0
    
    userInput db 4 dup(0)
    v1 dd ?
    v2 dd ?
    sum dd ?
    diff dd ?
    prod dd ?
    quot dd ?

.code
main:
    ; Nhap v1
    print addr msg1
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    movzx eax, al
    mov v1, eax

    ; Nhap v2
    print chr$(13,10)
    print addr msg2
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    movzx eax, al
    mov v2, eax

    ; Tinh tong (sum)
    mov eax, v1
    add eax, v2
    mov sum, eax
    print chr$(13,10)
    print addr msg4
    print str$(sum)

    ; Tinh hieu (diff)
    mov eax, v1
    sub eax, v2
    mov diff, eax
    print chr$(13,10)
    print addr msg5
    print str$(diff)

    ; Tinh tich (multiply)
    mov eax, v1
    mov ebx, v2
    imul eax, ebx       ; Tich luu trong EAX
    mov prod, eax
    print chr$(13,10)
    print addr msg6
    print str$(prod)

    ; Tinh thuong (divide)
    print chr$(13,10)
    mov ebx, v2
    cmp ebx, 0          ; Kiem tra v2 = 0
    je div_err

    ; Neu v2 != 0
    mov eax, v1
    cdq                 ; Mo rong dau EAX ra EDX:EAX
    idiv ebx            ; Chia EDX:EAX cho EBX (v2)
    mov quot, eax       ; Thuong nam trong EAX
    print addr msg7
    print str$(quot)
    jmp done

div_err:
    ; Neu v2 == 0
    print addr msg3

done:
    print chr$(13,10)
    exit
end main

